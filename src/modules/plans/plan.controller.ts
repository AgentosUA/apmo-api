import { Controller, Post, UseInterceptors } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { PlanService } from './plan.service';

@Controller('/plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
  create() {
    return this.planService.createPlan();
  }
}
