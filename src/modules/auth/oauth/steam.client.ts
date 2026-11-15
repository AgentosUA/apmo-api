import { Logger } from '@nestjs/common';

import {
  getApiPublicUrl,
  getCallbackUrl,
  getSteamConfig,
} from './oauth.config';
import { OAuthError, type ProviderIdentity } from './oauth.types';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const TIMEOUT = 10_000;

const logger = new Logger('SteamClient');

/**
 * "Sign in through Steam" — OpenID 2.0, which Steam still uses instead of
 * OAuth. The assertion is verified by asking Steam itself
 * (`check_authentication`), so no keys are needed. Steam shares no email.
 */
class SteamClient {
  getAuthorizationUrl({ state }: { state: string }) {
    const returnTo = new URL(getCallbackUrl('steam'));

    returnTo.searchParams.set('state', state);

    const url = new URL(STEAM_OPENID_URL);

    url.search = new URLSearchParams({
      'openid.ns': OPENID_NS,
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnTo.toString(),
      'openid.realm': getApiPublicUrl(),
      'openid.identity': IDENTIFIER_SELECT,
      'openid.claimed_id': IDENTIFIER_SELECT,
    }).toString();

    return url.toString();
  }

  /** `params` — the raw callback query (keys contain dots, e.g. `openid.sig`). */
  async handleCallback(params: URLSearchParams): Promise<ProviderIdentity> {
    const mode = params.get('openid.mode');

    if (mode === 'cancel') throw new OAuthError('cancelled');
    if (mode !== 'id_res') {
      throw new OAuthError('provider_error', `Unexpected openid.mode ${mode}`);
    }

    const returnTo = params.get('openid.return_to') ?? '';

    if (
      params.get('openid.op_endpoint') !== STEAM_OPENID_URL ||
      !returnTo.startsWith(`${getCallbackUrl('steam')}?`)
    ) {
      throw new OAuthError('invalid_state', 'Steam assertion is not for us');
    }

    const match = CLAIMED_ID_RE.exec(params.get('openid.claimed_id') ?? '');

    if (!match) throw new OAuthError('provider_error', 'Invalid claimed_id');

    const steamId = match[1];

    // Ask Steam to confirm the signature of exactly what it sent.
    const verification = new URLSearchParams();

    params.forEach((value, key) => {
      if (key.startsWith('openid.')) verification.set(key, value);
    });
    verification.set('openid.mode', 'check_authentication');

    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verification,
      signal: AbortSignal.timeout(TIMEOUT),
    }).catch(() => null);

    const body = response?.ok ? await response.text() : '';

    if (!/^is_valid\s*:\s*true$/m.test(body)) {
      throw new OAuthError('invalid_state', 'Steam did not confirm the login');
    }

    const profile = await this.getProfile(steamId);

    return {
      provider: 'steam',
      providerId: steamId,
      email: null,
      name: profile?.name ?? null,
      avatar: profile?.avatar ?? null,
    };
  }

  /** Nickname and avatar from the Steam Web API, when STEAM_API_KEY is set. */
  private async getProfile(steamId: string) {
    const { apiKey } = getSteamConfig();

    if (!apiKey) return null;

    try {
      const url = new URL(
        'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
      );

      url.search = new URLSearchParams({
        key: apiKey,
        steamids: steamId,
      }).toString();

      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        response?: {
          players?: { personaname?: string; avatarfull?: string }[];
        };
      };
      const player = data.response?.players?.[0];

      return player
        ? {
            name: player.personaname || null,
            avatar: player.avatarfull || null,
          }
        : null;
    } catch (error) {
      logger.warn(`Failed to load the Steam profile ${steamId}: ${error}`);
      return null;
    }
  }
}

export { SteamClient };
