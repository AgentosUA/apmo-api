import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PlanService } from './plan.service';
import { parsePlanBody } from './plan.dto';
import { parseAccessBody } from './plan-access';
import { AuthGuard } from '../auth/auth.guard';

@Controller('/plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Post('/')
  async create(@Req() req, @Body() body) {
    return this.planService.createPlan(
      parsePlanBody(body),
      await this.getOptionalUserId(req),
    );
  }

  /** Includes `permissions` of the requester; `access` only for the owner. */
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.planService.getPlan(id, await this.getOptionalUserId(req));
  }

  @Patch(':id')
  async updateOne(@Req() req, @Param('id') id: string, @Body() body) {
    return this.planService.updatePlan(
      id,
      parsePlanBody(body),
      await this.getOptionalUserId(req),
    );
  }

  /**
   * Owner only. Body:
   * `{ read: { level: 'public'|'restricted', users: id[], squads: id[] }, edit: { … } }`
   */
  @Patch(':id/access')
  @UseGuards(AuthGuard)
  async updateAccess(@Req() req, @Param('id') id: string, @Body() body) {
    return this.planService.updateAccess(
      id,
      parseAccessBody(body),
      req.user.userId as string,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteOne(@Req() req, @Param('id') id: string) {
    return this.planService.deletePlan(id, req.user.userId as string);
  }

  /** Anonymous requests are allowed; an invalid token counts as anonymous. */
  private async getOptionalUserId(req): Promise<string | undefined> {
    const token = this.authGuard.extractTokenFromHeader(req);

    if (!token) return undefined;

    try {
      return (
        (await this.authGuard.verifyAndGetUser(token))?.userId || undefined
      );
    } catch {
      return undefined;
    }
  }
}
