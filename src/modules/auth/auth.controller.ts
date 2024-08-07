import { Body, Controller, Post } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  constructor() {}

  @Post('/sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }
}
