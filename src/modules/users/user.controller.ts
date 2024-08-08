import { Controller, Get, Req, UseGuards } from '@nestjs/common';

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
}
