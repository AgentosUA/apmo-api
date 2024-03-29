import { Module } from '@nestjs/common';

import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
