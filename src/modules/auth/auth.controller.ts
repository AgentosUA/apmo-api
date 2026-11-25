import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  ChangePasswordDto,
  ForgotPasswordDto,
  SignInDto,
  SignUpDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { clearAuthCookies, setAuthCookies } from './auth.cookies';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Post('/sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  /** Sets the session cookies; the body has no tokens. */
  @Post('/sign-in')
  @HttpCode(200)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    setAuthCookies(res, await this.authService.signIn(dto));

    return this.authService.sessionInfo();
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

  /**
   * Refresh token from the `apmo_refresh` cookie (or Bearer for old clients).
   * On failure both cookies are cleared, so the browser stops sending dead ones.
   */
  @Post('/refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.authGuard.extractRefreshToken(req);

    try {
      if (!token) throw new UnauthorizedException();

      const { userId } = await this.authGuard.verifyRefreshToken(token);

      setAuthCookies(res, await this.authService.refreshToken(userId));
    } catch {
      clearAuthCookies(res);

      throw new UnauthorizedException('Session expired');
    }

    return this.authService.sessionInfo();
  }

  /** Works with an expired session too: it only clears the cookies. */
  @Post('/logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
}
