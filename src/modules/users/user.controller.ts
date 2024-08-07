import { Body, Controller, Post, UseGuards } from '@nestjs/common';

@Controller('/profile')
export class UserController {
  @Post('/')
  @UseGuards(AuthGuard())
  async getProfile(@Body()) {
    return 'Profile';
  }
}
