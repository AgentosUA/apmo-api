import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('/profile')
export class UserController {
  @Post('/')
  @UseGuards(new AuthGuard())
  async getProfile(@Body() dto) {
    console.log(dto);

    return 'Profile';
  }
}
