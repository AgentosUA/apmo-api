import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { OAuthController } from './oauth/oauth.controller';
import { OAuthService } from './oauth/oauth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2 days' },
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, OAuthService],
})
export class AuthModule {}
