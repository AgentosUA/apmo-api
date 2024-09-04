import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('/profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req) {
    const user = req['user'];

    return this.userService.getProfile(user.userId as string);
  }

  @Post('/change-avatar')
  @UseGuards(AuthGuard)
  async changeAvatar(@Req() req, @Body() body) {
    const user = req['user'];

    return this.userService.changeAvatar(user.userId as string, body.avatar);
  }
}
