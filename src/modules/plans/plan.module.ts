import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { Plan, PlanSchema } from './plan.schema';

import { User, UserSchema } from '../users/user.schema';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Plan.name,
        schema: PlanSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [PlanController],
  providers: [PlanService, AuthGuard],
})
export class PlanModule {}
