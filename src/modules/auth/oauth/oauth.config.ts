import { AUTH_PROVIDERS, type AuthProvider } from '../../users/user.schema';

const trimUrl = (value?: string) => (value ?? '').trim().replace(/\/+$/, '');

/** Public URL of the API without the `/api` prefix, e.g. https://arma-plan-maker.com */
const getApiPublicUrl = () => trimUrl(process.env.API_PUBLIC_URL);

/** First origin of FRONTEND_URL — where users are sent back after signing in. */
const getFrontendUrl = () =>
  (process.env.FRONTEND_URL ?? '').split(',').map(trimUrl).find(Boolean) ||
  'http://localhost:3001';

const getCallbackUrl = (provider: AuthProvider) =>
  `${getApiPublicUrl()}/api/auth/oauth/${provider}/callback`;

type OidcProviderConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  scope: string;
};

const GOOGLE_ISSUER = 'https://accounts.google.com';

const getOidcConfig = (
  provider: Exclude<AuthProvider, 'steam'>,
): OidcProviderConfig | null => {
  const env = process.env;

  const config =
    provider === 'google'
      ? {
          issuer: GOOGLE_ISSUER,
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          scope: 'openid email profile',
        }
      : {
          // https://<asp-api>/api/oidc, see asp-api/docs/sso.md
          issuer: trimUrl(env.VTG_ISSUER),
          clientId: env.VTG_CLIENT_ID,
          clientSecret: env.VTG_CLIENT_SECRET,
          scope: env.VTG_SCOPE || 'openid profile email',
        };

  if (!config.issuer || !config.clientId || !config.clientSecret) return null;

  return config as OidcProviderConfig;
};

/** Steam OpenID needs no keys (STEAM_AUTH_ENABLED=true turns it on); the Web API key only adds nickname and avatar. */
const getSteamConfig = () => ({
  apiKey: process.env.STEAM_API_KEY || null,
});

const isProviderEnabled = (provider: AuthProvider) => {
  if (!getApiPublicUrl()) return false;

  if (provider === 'steam') return process.env.STEAM_AUTH_ENABLED === 'true';

  return Boolean(getOidcConfig(provider));
};

const getEnabledProviders = () => AUTH_PROVIDERS.filter(isProviderEnabled);

const PROVIDER_NAMES: Record<AuthProvider, string> = {
  google: 'Google',
  steam: 'Steam',
  vtg: 'VTG',
};

const isAuthProvider = (value: unknown): value is AuthProvider =>
  AUTH_PROVIDERS.includes(value as AuthProvider);

export {
  getApiPublicUrl,
  getCallbackUrl,
  getEnabledProviders,
  getFrontendUrl,
  getOidcConfig,
  getSteamConfig,
  isAuthProvider,
  isProviderEnabled,
  PROVIDER_NAMES,
};
export type { OidcProviderConfig };
