import { sign } from 'jsonwebtoken';

import { hashSync, compareSync } from 'bcryptjs';

import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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

  async signIn({ email, username, password }: SignInDto) {
    const existedUser = await this.userModel.find({
      $or: [{ email }, { username }],
    });

    const passwordMatch = compareSync(password, existedUser?.[0]?.password);

    if (!existedUser.length || !passwordMatch) {
      throw new BadRequestException('Email, username or password is incorrect');
    }

    const token = sign({ id: existedUser[0].id }, process.env.JWT_SECRET, {
      expiresIn: '40h',
    });

    return {
      token,
      expiresIn: 40 * 60 * 60,
      expirationDate: new Date(Date.now() + 40 * 60 * 60 * 1000),
    };
  }
}
