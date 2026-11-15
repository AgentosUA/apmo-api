import type { AuthProvider } from '../../users/user.schema';

/** Who signed in, as the provider describes them. */
type ProviderIdentity = {
  provider: AuthProvider;
  /** Stable id: OIDC `sub` or SteamID64. Never the email or nickname. */
  providerId: string;
  /** Only set when the provider confirmed the address. */
  email: string | null;
  name: string | null;
  avatar: string | null;
};

/** Error codes the web app turns into messages (`#error=` of the callback). */
type OAuthErrorCode =
  | 'cancelled'
  | 'invalid_state'
  | 'provider_error'
  | 'not_enabled'
  | 'email_in_use'
  | 'account_in_use'
  | 'provider_already_linked'
  | 'user_not_found';

class OAuthError extends Error {
  constructor(
    readonly code: OAuthErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export { OAuthError };
export type { OAuthErrorCode, ProviderIdentity };
