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
    let userId = '';
    try {
      userId = await this.authGuard.verifyAndGetUser(token);
    } catch (error) {
      userId = '';
    }

    return this.planService.createPlan({ ...dto, userId });
  }

  @Get(':id')
  async findOne(@Param() id: string) {
    return this.planService.getPlanById({ id });
  }

  @Patch(':id')
  async updateOne(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const token = this.authGuard.extractTokenFromHeader(req);
    let userId = '';

    try {
      userId = (await this.authGuard.verifyAndGetUser(token)).userId;
    } catch (error) {
      userId = '';
    }

    return this.planService.updatePlanById({ id, ...dto }, userId);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string, @Req() req) {
    const user = await this.authGuard.verifyAndGetUser(
      this.authGuard.extractTokenFromHeader(req),
    );
    return this.planService.deletePlanByIdDto({ id }, user?.userId);
  }
}
