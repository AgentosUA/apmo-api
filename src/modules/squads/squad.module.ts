import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Squad, SquadSchema } from './squad.schema';
import { SquadService } from './squad.service';
import { SquadController } from './squad.controller';
import { User, UserSchema } from '../users/user.schema';
import { Plan, PlanSchema } from '../plans/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Squad.name, schema: SquadSchema },
      { name: User.name, schema: UserSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [SquadController],
  providers: [SquadService],
  exports: [SquadService],
})
export class SquadModule {}
