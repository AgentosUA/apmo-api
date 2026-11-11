import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';
import { UserController, UsersController } from './user.controller';
import { Plan, PlanSchema } from '../plans/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Plan.name,
        schema: PlanSchema,
      },
    ]),
  ],
  controllers: [UserController, UsersController],
  providers: [UserService],
})
export class UserModule {}
