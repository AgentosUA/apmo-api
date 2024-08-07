// import { Plan } from './plan.schema';

export class SignUpDto {
  readonly email: string;
  readonly login?: string;
  readonly password: string;
}

export class SignInDto {
  readonly email: string;
  readonly password: string;
}
