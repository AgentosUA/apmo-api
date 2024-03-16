import { Controller, Post } from '@nestjs/common';

import { PlanService } from './plan.service';

@Controller('/plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('/create')
  create() {
    return this.planService.createPlan();
  }
}
