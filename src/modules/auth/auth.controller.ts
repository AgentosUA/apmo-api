import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChangePasswordDto, SignInDto, SignUpDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('/sign-in')
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req,
    @Body() { newPassword, oldPassword }: ChangePasswordDto,
  ) {
    const userId = req['user'].userId as string;

    return this.authService.changePassword(userId, oldPassword, newPassword);
  }

  @Post('/refresh-token')
  @UseGuards(AuthGuard)
  async refreshToken(@Req() req) {
    const userId = req['user'].userId as string;

    return this.authService.refreshToken(userId);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() { email }: { email: string }) {
    return this.authService.forgotPassword(email);
  }
}
