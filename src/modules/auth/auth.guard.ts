import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);

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

  public async verifyAndGetUser(token = '') {
    const user = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });

    return user;
  }

  public extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
