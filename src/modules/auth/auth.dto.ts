// import { Plan } from './plan.schema';

export class SignUpDto {
  readonly email: string;
  readonly username?: string;
  readonly password: string;
}

export class SignInDto {
  readonly email?: string;
  readonly username?: string;
  readonly password: string;
}

export class ChangePasswordDto {
  readonly oldPassword: string;
  readonly newPassword: string;
}
