import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { escapeRegex } from 'src/shared/utils/validation';

import { MailService } from '../../mail/mail.service';
import {
  accountLinkedEmail,
  resolveMailLanguage,
  welcomeEmail,
} from '../../mail/templates';
import { type AuthProvider, User } from '../../users/user.schema';
import { USERNAME_MAX, USERNAME_MIN } from '../../users/username';
import { AuthService } from '../auth.service';
import {
  getApiPublicUrl,
  getFrontendUrl,
  getOidcConfig,
  isProviderEnabled,
  PROVIDER_NAMES,
} from './oauth.config';
import {
  createPkce,
  getLinkSecret,
  getStateSecret,
  LINK_TICKET_TTL_SECONDS,
  type LinkTicketPayload,
  markTicketUsed,
  type OAuthStatePayload,
  randomToken,
  STATE_TTL_SECONDS,
} from './oauth.state';
import { OAuthError, type ProviderIdentity } from './oauth.types';
import { OidcClient } from './oidc.client';
import { SteamClient } from './steam.client';

/** Keeps letters (any script), digits and a few separators. */
const sanitizeUsername = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} _.\-[\]]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, USERNAME_MAX);

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number })?.code === 11000;

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  private readonly steam = new SteamClient();

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly mail: MailService,
  ) {}

  /* ----------------------------- the flow ----------------------------- */

  /**
   * Where to send the browser and the state cookie to set.
   * `linkTicket` — from `createLinkUrl`, when linking from the profile.
   */
  async start(
    provider: AuthProvider,
    { linkTicket, lang }: { linkTicket?: string; lang?: string },
  ) {
    if (!isProviderEnabled(provider)) throw new OAuthError('not_enabled');

    let userId: string | undefined;

    if (linkTicket) {
      const ticket = await this.jwtService
        .verifyAsync<LinkTicketPayload>(linkTicket, { secret: getLinkSecret() })
        .catch(() => null);

      if (
        !ticket ||
        ticket.typ !== 'oauth_link' ||
        ticket.provider !== provider ||
        !markTicketUsed(ticket.jti)
      ) {
        throw new OAuthError('invalid_state', 'Invalid link ticket');
      }

      userId = ticket.userId;
    }

    const state = randomToken();
    const { codeVerifier, codeChallenge } = createPkce();

    const url =
      provider === 'steam'
        ? this.steam.getAuthorizationUrl({ state })
        : await this.getOidcClient(provider).getAuthorizationUrl({
            state,
            codeChallenge,
            locale: lang,
          });

    const payload: OAuthStatePayload = {
      typ: 'oauth_state',
      provider,
      state,
      codeVerifier,
      userId,
      lang,
    };

    const cookie = await this.jwtService.signAsync(payload, {
      secret: getStateSecret(),
      expiresIn: STATE_TTL_SECONDS,
    });

    return { url, cookie };
  }

  /**
   * Handles the provider callback. Returns the web app URL to redirect to and,
   * after a sign-in, the token pair the controller puts into cookies.
   */
  async finish(
    provider: AuthProvider,
    query: URLSearchParams,
    cookie: string | undefined,
  ) {
    const statePayload = cookie
      ? await this.jwtService
          .verifyAsync<OAuthStatePayload>(cookie, { secret: getStateSecret() })
          .catch(() => null)
      : null;

    if (
      !statePayload ||
      statePayload.typ !== 'oauth_state' ||
      statePayload.provider !== provider ||
      statePayload.state !== query.get('state')
    ) {
      throw new OAuthError('invalid_state');
    }

    const identity =
      provider === 'steam'
        ? await this.steam.handleCallback(query)
        : await this.getOidcClient(provider).handleCallback(
            Object.fromEntries(query.entries()),
            statePayload.codeVerifier,
          );

    if (statePayload.userId) {
      await this.link(statePayload.userId, identity, statePayload.lang);

      return { url: this.callbackUrl({ linked: provider }) };
    }

    const { userId, isNew } = await this.login(identity, statePayload.lang);

    return {
      url: this.callbackUrl({
        signedIn: '1',
        provider,
        ...(isNew ? { new: '1' } : {}),
      }),
      tokens: this.authService.issueTokens(userId),
    };
  }

  /** The web app's callback page; data goes in the fragment, which never reaches servers. */
  callbackUrl(params: Record<string, string>) {
    return `${getFrontendUrl()}/auth/callback#${new URLSearchParams(params)}`;
  }

  /* ------------------------------ linking ------------------------------ */

  /** URL the web app opens to link `provider` to the signed-in user. */
  async createLinkUrl(userId: string, provider: AuthProvider, lang?: string) {
    if (!isProviderEnabled(provider)) {
      throw new BadRequestException('Sign-in method is not enabled');
    }

    const payload: LinkTicketPayload = {
      typ: 'oauth_link',
      provider,
      userId,
      jti: randomToken(16),
    };

    const ticket = await this.jwtService.signAsync(payload, {
      secret: getLinkSecret(),
      expiresIn: LINK_TICKET_TTL_SECONDS,
    });

    const url = new URL(`${getApiPublicUrl()}/api/auth/oauth/${provider}`);

    url.searchParams.set('link', ticket);
    if (lang) url.searchParams.set('lang', lang);

    return { url: url.toString() };
  }

  /** Removes a sign-in method, unless it is the last way to log in. */
  async unlink(userId: string, provider: AuthProvider) {
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .select('password accounts')
      .lean();

    if (!user) throw new BadRequestException('User not found');

    const accounts = user.accounts ?? [];

    if (!accounts.some((account) => account.provider === provider)) {
      throw new BadRequestException('Sign-in method is not linked');
    }

    const remaining = accounts.length - 1 + (user.password ? 1 : 0);

    if (remaining < 1) {
      throw new BadRequestException(
        'Cannot remove the only sign-in method. Set a password first',
      );
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { $pull: { accounts: { provider } } },
    );
  }

  /* ------------------------------ internals ------------------------------ */

  private getOidcClient(provider: Exclude<AuthProvider, 'steam'>) {
    const config = getOidcConfig(provider);

    if (!config) throw new OAuthError('not_enabled');

    return new OidcClient(provider, config);
  }

  private findByAccount({ provider, providerId }: ProviderIdentity) {
    return this.userModel.findOne({
      accounts: { $elemMatch: { provider, providerId } },
    });
  }

  private findByEmail(email: string) {
    return this.userModel.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    });
  }

  /** Signs in an existing linked user or creates a new one. */
  private async login(identity: ProviderIdentity, lang?: string) {
    const linked = await this.findByAccount(identity);

    if (linked) {
      // Keep the display name on the profile's "Sign-in methods" fresh.
      if (identity.name)
        await this.userModel.updateOne(
          {
            _id: linked._id,
            'accounts.provider': identity.provider,
          },
          { $set: { 'accounts.$.name': identity.name } },
        );

      return { userId: String(linked._id), isNew: false };
    }

    /*
     * An account with this email exists but this provider is not linked to it.
     * APMO never verified emails, so linking automatically could hand someone
     * else's pre-registered account to the owner of the email (or the other
     * way round). The user logs in with the password and links it in profile.
     */
    if (identity.email && (await this.findByEmail(identity.email))) {
      throw new OAuthError('email_in_use');
    }

    const username = await this.getFreeUsername(identity);

    try {
      const user = await this.userModel.create({
        email: identity.email ?? undefined,
        username,
        avatar: identity.avatar,
        language: resolveMailLanguage(lang),
        accounts: [this.toAccount(identity)],
      });

      if (user.email) {
        this.mail.sendInBackground({
          to: user.email,
          message: welcomeEmail({
            lang: resolveMailLanguage(user.language),
            username: user.username,
          }),
        });
      }

      return { userId: String(user._id), isNew: true };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      // Two callbacks at once for the same account: the other one created it.
      const created = await this.findByAccount(identity);

      if (created) return { userId: String(created._id), isNew: false };

      throw new OAuthError('email_in_use');
    }
  }

  private async link(
    userId: string,
    identity: ProviderIdentity,
    lang?: string,
  ) {
    const owner = await this.findByAccount(identity);

    if (owner) {
      if (String(owner._id) === userId) return;

      throw new OAuthError('account_in_use');
    }

    const user = await this.userModel.findById(new Types.ObjectId(userId));

    if (!user) throw new OAuthError('user_not_found');

    if (
      user.accounts?.some((account) => account.provider === identity.provider)
    ) {
      throw new OAuthError('provider_already_linked');
    }

    // A Steam-only user gets the verified email of Google / VTG, if it is free.
    const takeEmail =
      !user.email &&
      identity.email &&
      !(await this.findByEmail(identity.email));

    try {
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $push: { accounts: this.toAccount(identity) },
          ...(takeEmail ? { $set: { email: identity.email } } : {}),
        },
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new OAuthError('account_in_use');
      throw error;
    }

    const email = user.email || (takeEmail ? identity.email : null);

    if (email) {
      this.mail.sendInBackground({
        to: email,
        message: accountLinkedEmail({
          lang: resolveMailLanguage(user.language, lang),
          username: user.username,
          provider: PROVIDER_NAMES[identity.provider],
          accountName: identity.email || identity.name,
        }),
      });
    }
  }

  private toAccount(identity: ProviderIdentity) {
    return {
      provider: identity.provider,
      providerId: identity.providerId,
      name: identity.name,
      email: identity.email,
      linkedAt: new Date(),
    };
  }

  /** The provider nickname, or `<nickname>_1234` when it is taken. */
  private async getFreeUsername(identity: ProviderIdentity) {
    const base =
      [identity.name, identity.email?.split('@')[0]]
        .map((value) => sanitizeUsername(value ?? ''))
        .find((value) => value.length >= USERNAME_MIN) ??
      `${identity.provider}_${identity.providerId.slice(-6)}`;

    const isFree = async (username: string) =>
      !(await this.userModel.exists({
        username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' },
      }));

    if (await isFree(base)) return base;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      const candidate = `${base.slice(0, USERNAME_MAX - suffix.length - 1)}_${suffix}`;

      if (await isFree(candidate)) return candidate;
    }

    return `${base.slice(0, USERNAME_MAX - 9)}_${randomToken(6).slice(0, 8)}`;
  }

  logError(error: unknown) {
    this.logger.error(
      'OAuth callback failed',
      error instanceof Error ? error.stack : String(error),
    );
  }
}
