import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { Plan, PlanSchema } from './plan.schema';
import { PlanAccessService } from './plan-access.service';
import { PlanRoomsService } from './plan-rooms.service';
import { PlanGateway } from './plan.gateway';

import { User, UserSchema } from '../users/user.schema';
import { Squad, SquadSchema } from '../squads/squad.schema';
import { SquadModule } from '../squads/squad.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: User.name, schema: UserSchema },
      { name: Squad.name, schema: SquadSchema },
    ]),
    SquadModule,
  ],
  controllers: [PlanController],
  providers: [
    PlanService,
    PlanAccessService,
    PlanRoomsService,
    PlanGateway,
    AuthGuard,
  ],
})
export class PlanModule {}
