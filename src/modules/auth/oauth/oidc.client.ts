import { Logger } from '@nestjs/common';

import type { AuthProvider } from '../../users/user.schema';
import { getCallbackUrl, type OidcProviderConfig } from './oauth.config';
import { OAuthError, type ProviderIdentity } from './oauth.types';

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
};

type UserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean | 'true' | 'false';
  name?: string;
  preferred_username?: string;
  nickname?: string;
  picture?: string;
};

const DISCOVERY_TTL = 60 * 60 * 1000;
const TIMEOUT = 10_000;

const discoveryCache = new Map<
  string,
  { value: Discovery; expiresAt: number }
>();

const logger = new Logger('OidcClient');

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');

    logger.warn(`${init?.method ?? 'GET'} ${url} → ${response.status} ${body}`);
    throw new OAuthError('provider_error');
  }

  return (await response.json()) as T;
};

/**
 * Minimal OpenID Connect relying party (Authorization Code + PKCE), enough
 * for Google and VTG (asp-api, node-oidc-provider). Endpoints come from
 * discovery. The user is read from `userinfo` with the access token received
 * directly from the token endpoint over TLS, so the ID token signature does
 * not need to be checked (OIDC Core 3.1.3.7).
 */
class OidcClient {
  constructor(
    private readonly provider: AuthProvider,
    private readonly config: OidcProviderConfig,
  ) {}

  private async discover(): Promise<Discovery> {
    const cached = discoveryCache.get(this.config.issuer);

    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const value = await fetchJson<Discovery>(
      `${this.config.issuer}/.well-known/openid-configuration`,
    );

    if (
      !value.authorization_endpoint ||
      !value.token_endpoint ||
      !value.userinfo_endpoint
    ) {
      throw new OAuthError('provider_error', 'Incomplete OIDC discovery');
    }

    discoveryCache.set(this.config.issuer, {
      value,
      expiresAt: Date.now() + DISCOVERY_TTL,
    });

    return value;
  }

  async getAuthorizationUrl({
    state,
    codeChallenge,
    locale,
  }: {
    state: string;
    codeChallenge: string;
    locale?: string;
  }) {
    const { authorization_endpoint } = await this.discover();
    const url = new URL(authorization_endpoint);

    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: getCallbackUrl(this.provider),
      scope: this.config.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...(this.provider === 'google' ? { prompt: 'select_account' } : {}),
      ...(locale ? { ui_locales: locale } : {}),
    }).toString();

    return url.toString();
  }

  /** Validates the callback query and returns who signed in. */
  async handleCallback(
    query: Record<string, unknown>,
    codeVerifier: string,
  ): Promise<ProviderIdentity> {
    if (query.error) {
      throw new OAuthError(
        query.error === 'access_denied' ? 'cancelled' : 'provider_error',
        String(query.error_description ?? query.error),
      );
    }

    const code = typeof query.code === 'string' ? query.code : null;

    if (!code) throw new OAuthError('provider_error', 'No code in callback');

    const discovery = await this.discover();

    // RFC 9207: providers that send `iss` must send their own.
    if (typeof query.iss === 'string' && query.iss !== discovery.issuer) {
      throw new OAuthError('invalid_state', 'Issuer mismatch');
    }

    const tokens = await fetchJson<{
      access_token?: string;
      token_type?: string;
    }>(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getCallbackUrl(this.provider),
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokens.access_token) {
      throw new OAuthError('provider_error', 'No access token');
    }

    const info = await fetchJson<UserInfo>(discovery.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!info.sub) throw new OAuthError('provider_error', 'No sub in userinfo');

    const emailVerified =
      info.email_verified === true || info.email_verified === 'true';

    return {
      provider: this.provider,
      providerId: String(info.sub),
      email: info.email && emailVerified ? info.email.trim() : null,
      name: info.preferred_username || info.nickname || info.name || null,
      avatar: info.picture || null,
    };
  }
}

export { OidcClient };
