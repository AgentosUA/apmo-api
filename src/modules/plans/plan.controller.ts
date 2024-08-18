import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';

import { PlanService } from './plan.service';

import { CreatePlanDto, UpdatePlanDto } from './plan.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('/plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Post('/')
  async create(@Req() req, @Body() dto: CreatePlanDto) {
    const token = this.authGuard.extractTokenFromHeader(req);
    const user = await this.authGuard.verifyAndGetUser(token);

    return this.planService.createPlan({ ...dto, userId: user?.userId });
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
  async deleteOne(@Param('id') id: string, @Req() req) {
    const user = await this.authGuard.verifyAndGetUser(
      this.authGuard.extractTokenFromHeader(req),
    );
    return this.planService.deletePlanByIdDto({ id }, user?.userId);
  }
}
