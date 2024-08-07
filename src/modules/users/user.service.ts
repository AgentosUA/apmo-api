import { Model } from 'mongoose';
import { User } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';

export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
}
