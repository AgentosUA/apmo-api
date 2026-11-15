import { randomFillSync } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { hashSync, compareSync } from 'bcryptjs';

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ForgotPasswordDto, SignInDto, SignUpDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service';
import {
  resolveMailLanguage,
  temporaryPasswordEmail,
  welcomeEmail,
} from '../mail/templates';

const TOKEN_TTL_SECONDS = 40 * 60 * 60;

/** bcrypt never throws on a user without a password (external sign-in only). */
const matches = (password: unknown, hash?: string | null) =>
  typeof password === 'string' && Boolean(hash) && compareSync(password, hash);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mail: MailService,
  ) {}

  async signUp({ email, username, password, language }: SignUpDto) {
    const existedUser = await this.userModel.find({
      $or: [{ email }, { username }],
    });

    if (existedUser.length) {
      throw new BadRequestException('Email or username already exists');
    }

    const hashedPassword = hashSync(password, 15);

    const newUser = await new this.userModel({
      email,
      username,
      password: hashedPassword,
      language: resolveMailLanguage(language),
    }).save();

    this.mail.sendInBackground({
      to: newUser.email,
      message: welcomeEmail({
        lang: resolveMailLanguage(newUser.language),
        username: newUser.username,
      }),
    });

    // Never send the password hash back.
    const user = newUser.toJSON();

    delete user.password;
    delete user.tempPassword;

    return user;
  }

  async signIn({ email, username = email, password }: SignInDto) {
    if (!email && !username) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    const existedUser = await this.userModel.find({
      $or: [{ email }, { username }],
    });

    const user = existedUser[0];

    if (!user) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    const passwordMatch =
      matches(password, user.password) || matches(password, user.tempPassword);

    if (!passwordMatch) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    return this.issueTokens(user.id);
  }

  async changePassword(
    userId: string,
    oldPassword: string | undefined,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      throw new BadRequestException('New password is required');
    }

    // Users who signed up with Google / Steam / VTG set their first password.
    const hasPassword = Boolean(user.password || user.tempPassword);

    const passwordMatch =
      !hasPassword ||
      matches(oldPassword, user.password) ||
      matches(oldPassword, user.tempPassword);

    if (!passwordMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = hashSync(newPassword, 15);

    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      tempPassword: null,
    });

    return;
  }

  async forgotPassword({ email, language }: ForgotPasswordDto) {
    const user = email ? await this.userModel.findOne({ email }) : null;

    if (!user) {
      throw new BadRequestException('Email is not found');
    }

    const length = 20;
    const characters =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';

    const tempPassword = Array.from(randomFillSync(new Uint32Array(length)))
      .map((x) => characters[x % characters.length])
      .join('');

    const hashedPassword = hashSync(tempPassword, 15);

    await this.userModel.findByIdAndUpdate(user.id, {
      tempPassword: hashedPassword,
    });

    try {
      await this.mail.send({
        to: user.email,
        message: temporaryPasswordEmail({
          lang: resolveMailLanguage(language, user.language),
          username: user.username,
          password: tempPassword,
        }),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send the temporary password to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'Failed to send the email, please try again later',
      );
    }

    return;
  }

  async refreshToken(userId: string) {
    return this.issueTokens(userId);
  }

  /** Access + refresh token pair, the same for every way of signing in. */
  issueTokens(userId: string) {
    const token = this.jwtService.sign({
      userId,
    });

    const refreshToken = this.jwtService.sign(
      {
        userId,
      },
      {
        expiresIn: '7d',
      },
    );

    return {
      token,
      refreshToken,
      expiresIn: TOKEN_TTL_SECONDS,
      expirationDate: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
    };
  }
}
