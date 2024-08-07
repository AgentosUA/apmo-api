import jwt from 'jsonwebtoken';

import { Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private planModel: Model<User>) {}

  async signUp(dto: SignUpDto) {
    const newUser = new this.planModel(dto);

    return newUser.save();
  }

  async signIn(dto: SignInDto) {
    const token = jwt.sign({});

    return token;
  }
}
