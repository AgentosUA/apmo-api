import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthGuard } from '../auth.guard';
import { getEnabledProviders, isAuthProvider } from './oauth.config';
import { OAuthService } from './oauth.service';
import {
  clearStateCookie,
  readCookie,
  serializeStateCookie,
  STATE_COOKIE,
} from './oauth.state';
import { OAuthError } from './oauth.types';
import { resolveMailLanguage } from '../../mail/templates';

const readProvider = (value: string) => {
  if (!isAuthProvider(value)) {
    throw new BadRequestException('Unknown sign-in method');
  }

  return value;
};

/**
 * Sign in with Google, Steam and VTG.
 *
 * - `GET  /auth/oauth/providers`          — enabled providers
 * - `GET  /auth/oauth/:provider`          — browser redirect to the provider
 * - `GET  /auth/oauth/:provider/callback` — back from it, then to the web app
 *   (`/auth/callback#token=…` or `#error=…`)
 * - `POST /auth/oauth/:provider/link`     — `{ url }` to link it to the user
 * - `DELETE /auth/oauth/:provider`        — unlink
 */
@Controller('/auth/oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('/providers')
  providers() {
    return { providers: getEnabledProviders() };
  }

  @Get('/:provider')
  async start(
    @Param('provider') provider: string,
    @Query('link') link: unknown,
    @Query('lang') lang: unknown,
    @Res() res: Response,
  ) {
    try {
      const { url, cookie } = await this.oauthService.start(
        readProvider(provider),
        {
          linkTicket: typeof link === 'string' ? link : undefined,
          lang:
            typeof lang === 'string' ? resolveMailLanguage(lang) : undefined,
        },
      );

      res.setHeader('Set-Cookie', serializeStateCookie(cookie));
      res.setHeader('Cache-Control', 'no-store');
      res.redirect(302, url);
    } catch (error) {
      this.redirectWithError(res, provider, error);
    }
  }

  @Get('/:provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Raw query: Steam parameters have dots in their names.
    const query = new URL(req.originalUrl, 'http://localhost').searchParams;
    const cookie = readCookie(req.headers.cookie, STATE_COOKIE);

    res.setHeader('Set-Cookie', clearStateCookie());
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');

    try {
      const url = await this.oauthService.finish(
        readProvider(provider),
        query,
        cookie,
      );

      res.redirect(302, url);
    } catch (error) {
      this.redirectWithError(res, provider, error);
    }
  }

  @Post('/:provider/link')
  @UseGuards(AuthGuard)
  async link(
    @Req() req,
    @Param('provider') provider: string,
    @Query('lang') lang: unknown,
  ) {
    return this.oauthService.createLinkUrl(
      req.user.userId as string,
      readProvider(provider),
      typeof lang === 'string' ? resolveMailLanguage(lang) : undefined,
    );
  }

  @Delete('/:provider')
  @UseGuards(AuthGuard)
  async unlink(@Req() req, @Param('provider') provider: string) {
    await this.oauthService.unlink(
      req.user.userId as string,
      readProvider(provider),
    );
  }

  private redirectWithError(res: Response, provider: string, error: unknown) {
    if (!(error instanceof OAuthError) || error.code === 'provider_error') {
      this.oauthService.logError(error);
    }

    const code = error instanceof OAuthError ? error.code : 'provider_error';

    res.redirect(
      302,
      this.oauthService.callbackUrl({
        error: code,
        ...(isAuthProvider(provider) ? { provider } : {}),
      }),
    );
  }
}
