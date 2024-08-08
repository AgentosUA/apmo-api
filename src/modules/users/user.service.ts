import mongoose, { Model } from 'mongoose';
import { User } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';

export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getProfile(userId: string) {
    return this.userModel
      .findById(new mongoose.Types.ObjectId(userId))
      .select('-password -__v');
  }
}
