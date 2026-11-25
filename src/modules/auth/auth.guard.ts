import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { readAccessCookie, readRefreshCookie } from './auth.cookies';

/** `typ` claim. Tokens issued before it existed have none and are accepted by both checks. */
type TokenType = 'access' | 'refresh';

type TokenPayload = { userId: string; typ?: TokenType };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const user = await this.verifyAndGetUser(token);

      request['user'] = {
        userId: user.userId,
      };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  /** Access token; a refresh token is rejected. */
  public async verifyAndGetUser(token = '') {
    return this.verify(token, 'access');
  }

  /** Refresh token; an access token is rejected. */
  public async verifyRefreshToken(token = '') {
    return this.verify(token, 'refresh');
  }

  /** The httpOnly cookie, or `Authorization: Bearer` (scripts, old clients). */
  public extractToken(request: any): string | undefined {
    return (
      readAccessCookie(request?.headers?.cookie) ||
      this.extractTokenFromHeader(request)
    );
  }

  public extractRefreshToken(request: any): string | undefined {
    return (
      readRefreshCookie(request?.headers?.cookie) ||
      this.extractTokenFromHeader(request)
    );
  }

  public extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }

  private async verify(token: string, expected: TokenType) {
    const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (payload.typ && payload.typ !== expected) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
