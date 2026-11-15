export class SignUpDto {
  readonly email: string;
  readonly username?: string;
  readonly password: string;
  /** Language of the web app (`en`, `uk`, `cz`), used for emails. */
  readonly language?: string;
}

export class SignInDto {
  readonly email?: string;
  readonly username?: string;
  readonly password: string;
}

export class ChangePasswordDto {
  /** Not needed when the user has no password yet (signed up with Google / Steam / VTG). */
  readonly oldPassword?: string;
  readonly newPassword: string;
}

export class ForgotPasswordDto {
  readonly email: string;
  readonly language?: string;
}
