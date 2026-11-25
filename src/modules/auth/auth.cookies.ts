import type { CookieOptions, Response } from 'express';

import { getApiPublicUrl, getFrontendUrls } from './oauth/oauth.config';
import { readCookie } from './oauth/oauth.state';

/**
 * Session cookies. Both are httpOnly: the web app never sees the tokens, it
 * only sends the cookies with `withCredentials` and asks `/profile` who it is.
 *
 * - access  — every request under `/api`;
 * - refresh — only `/api/auth/*` (refresh-token, logout), so it does not travel
 *   with every request.
 */
const ACCESS_COOKIE = 'apmo_access';
const REFRESH_COOKIE = 'apmo_refresh';

const ACCESS_COOKIE_PATH = '/api';
const REFRESH_COOKIE_PATH = '/api/auth';

const ACCESS_TTL_SECONDS = 2 * 24 * 60 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const baseOptions = (): CookieOptions => ({
  httpOnly: true,
  // Lax: sent on same-site requests (web app and API share the site), never on
  // cross-site POST / PATCH / DELETE — that is what protects us from CSRF.
  sameSite: 'lax',
  secure: getApiPublicUrl().startsWith('https://'),
});

const setAuthCookies = (
  res: Response,
  { token, refreshToken }: { token: string; refreshToken: string },
) => {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions(),
    path: ACCESS_COOKIE_PATH,
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
  });
};

const readAccessCookie = (cookieHeader: string | undefined) =>
  readCookie(cookieHeader, ACCESS_COOKIE);

const readRefreshCookie = (cookieHeader: string | undefined) =>
  readCookie(cookieHeader, REFRESH_COOKIE);

/**
 * Credentialed CORS cannot use `*`: only the web app origins (FRONTEND_URL,
 * comma separated) may send the session cookies. Requests without an Origin
 * (server-to-server, curl) are not affected by CORS at all.
 */
const isAllowedOrigin = (origin: string | undefined) =>
  !origin || getFrontendUrls().includes(origin.replace(/\/+$/, ''));

const corsOrigin = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) => callback(null, isAllowedOrigin(origin));

export {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  clearAuthCookies,
  corsOrigin,
  readAccessCookie,
  readRefreshCookie,
  setAuthCookies,
};
