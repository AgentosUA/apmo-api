import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';

import { PlanService } from './plan.service';

import { CreatePlanDto, UpdatePlanDto } from './plan.dto';

@Controller('/plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('/')
  async create(@Body() dto: CreatePlanDto) {
    return this.planService.createPlan(dto);
  }

  @Get(':id')
  async findOne(@Param() id: string) {
    return this.planService.getPlanById({ id });
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.planService.getPlanById({ id, ...dto });
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    return this.planService.deletePlanByIdDto({ id });
  }
}
