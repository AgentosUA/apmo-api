import { createHash, randomBytes } from 'crypto';

import type { AuthProvider } from '../../users/user.schema';
import { getApiPublicUrl } from './oauth.config';

/** Lives for one round trip to the provider. */
const STATE_COOKIE = 'apmo_oauth';
const STATE_COOKIE_PATH = '/api/auth/oauth';
const STATE_TTL_SECONDS = 10 * 60;

/** A link ticket only has to survive the redirect from the web app. */
const LINK_TICKET_TTL_SECONDS = 2 * 60;

/** What the API remembers between the redirect and the callback. */
type OAuthStatePayload = {
  typ: 'oauth_state';
  provider: AuthProvider;
  state: string;
  codeVerifier: string;
  /** Set when an authorized user links a provider from the profile. */
  userId?: string;
  lang?: string;
};

type LinkTicketPayload = {
  typ: 'oauth_link';
  provider: AuthProvider;
  userId: string;
  jti: string;
};

/**
 * Secrets derived from JWT_SECRET, so that state cookies and link tickets
 * can never be used as access tokens (AuthGuard checks JWT_SECRET only).
 */
const getStateSecret = () => `${process.env.JWT_SECRET}:oauth-state`;
const getLinkSecret = () => `${process.env.JWT_SECRET}:oauth-link`;

const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

const createPkce = () => {
  const codeVerifier = randomToken(48);
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
};

const serializeStateCookie = (value: string, maxAge = STATE_TTL_SECONDS) =>
  [
    `${STATE_COOKIE}=${value}`,
    `Path=${STATE_COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    // Lax: the cookie comes back on the top-level redirect from the provider.
    'SameSite=Lax',
    ...(getApiPublicUrl().startsWith('https://') ? ['Secure'] : []),
  ].join('; ');

const clearStateCookie = () => serializeStateCookie('', 0);

const readCookie = (header: string | undefined, name: string) =>
  (header ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

/**
 * Link tickets are single use. Kept in memory: enough for one API instance,
 * and a ticket lives only two minutes anyway.
 */
const usedTickets = new Map<string, number>();

const markTicketUsed = (jti: string) => {
  const now = Date.now();

  usedTickets.forEach((expiresAt, key) => {
    if (expiresAt < now) usedTickets.delete(key);
  });

  if (usedTickets.has(jti)) return false;

  usedTickets.set(jti, now + LINK_TICKET_TTL_SECONDS * 1000);

  return true;
};

export {
  clearStateCookie,
  createPkce,
  getLinkSecret,
  getStateSecret,
  LINK_TICKET_TTL_SECONDS,
  markTicketUsed,
  randomToken,
  readCookie,
  serializeStateCookie,
  STATE_COOKIE,
  STATE_TTL_SECONDS,
};
export type { LinkTicketPayload, OAuthStatePayload };
