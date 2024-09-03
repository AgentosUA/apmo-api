import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';

import { hashSync, compareSync } from 'bcryptjs';

import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp({ email, username, password }: SignUpDto) {
    const existedUser = await this.userModel.find({
      $or: [{ email }, { username }],
    });

    if (existedUser.length) {
      throw new BadRequestException('Email or username already exists');
    }

    const hashedPassword = hashSync(password, 15);

    const newUser = new this.userModel({
      email,
      username,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async signIn({ email, username = email, password }: SignInDto) {
    const existedUser = await this.userModel.find({
      $or: [{ email }, { username }],
    });

    if (!existedUser.length) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    const passwordMatch =
      compareSync(password, existedUser?.[0]?.password) ||
      (existedUser?.[0]?.tempPassword !== null &&
        compareSync(password, existedUser?.[0]?.tempPassword));

    if (!passwordMatch) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    const token = this.jwtService.sign({
      userId: existedUser[0].id,
    });

    const refreshToken = this.jwtService.sign(
      {
        userId: existedUser[0].id,
      },
      {
        expiresIn: '7d',
      },
    );

    return {
      token,
      refreshToken,
      expiresIn: 40 * 60 * 60,
      expirationDate: new Date(Date.now() + 40 * 60 * 60 * 1000),
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);

    const passwordMatch =
      compareSync(oldPassword, user.password) ||
      compareSync(oldPassword, user.tempPassword);

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

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Email is not found');
    }

    const tempPassword = Math.random().toString(36);

    const hashedPassword = hashSync(tempPassword, 15);

    await this.userModel.findByIdAndUpdate(user.id, {
      tempPassword: hashedPassword,
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'apmo.help@gmail.com', // todo: change to APMO email
        pass: process.env.GMAIL_APP_SECRET,
      },
    });

    const mailOptions = {
      from: 'apmo.help@gmail.com',
      to: email,
      subject: 'APMO Temporary Password',
      html: `Your temporary password is <b>${tempPassword}</b>. Please change it after login.`,
      // todo: create a template for this email
    };

    transporter.sendMail(mailOptions);

    return;
  }

  async refreshToken(userId: string) {
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
      expiresIn: 40 * 60 * 60,
      expirationDate: new Date(Date.now() + 40 * 60 * 60 * 1000),
    };
  }
}
