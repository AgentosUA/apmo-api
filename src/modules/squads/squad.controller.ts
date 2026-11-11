import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from '../auth/auth.guard';
import {
  FILE_MAX_SIZE,
  FileValidation,
} from 'src/shared/utils/file-validation';
import { readString } from 'src/shared/utils/validation';

import { SquadService } from './squad.service';
import { parseCreateSquadBody, parseUpdateSquadBody } from './squad.dto';

@Controller('/squads')
@UseGuards(AuthGuard)
export class SquadController {
  constructor(private readonly squadService: SquadService) {}

  /** Squads the current user owns or is a member of. */
  @Get('/my')
  async listMine(@Req() req) {
    return this.squadService.listMine(req.user.userId);
  }

  /** `GET /squads/search?q=` — by name or tag. */
  @Get('/search')
  async search(@Query('q') q: unknown) {
    return this.squadService.search(readString(q, 'q') ?? '');
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.squadService.getById(id);
  }

  @Post('/')
  async create(@Req() req, @Body() body) {
    return this.squadService.create(
      req.user.userId,
      parseCreateSquadBody(body),
    );
  }

  @Patch(':id')
  async update(@Req() req, @Param('id') id: string, @Body() body) {
    return this.squadService.update(
      req.user.userId,
      id,
      parseUpdateSquadBody(body),
    );
  }

  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    return this.squadService.remove(req.user.userId, id);
  }

  /** `{ userId }` — owner only. */
  @Post(':id/members')
  async addMember(@Req() req, @Param('id') id: string, @Body() body) {
    return this.squadService.addMember(req.user.userId, id, body?.userId);
  }

  /** Owner removes a member, or a member leaves (`memberId` = own id). */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Req() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.squadService.removeMember(req.user.userId, id, memberId);
  }

  /** `multipart/form-data`, image in the `logo` field (JPEG/PNG/GIF/WebP, ≤ 5 MB). */
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: FILE_MAX_SIZE + 1024, files: 1 },
    }),
  )
  async uploadLogo(
    @Req() req,
    @Param('id') id: string,
    @FileValidation() file: Express.Multer.File,
  ) {
    return this.squadService.uploadLogo(req.user.userId, id, file);
  }

  @Delete(':id/logo')
  async removeLogo(@Req() req, @Param('id') id: string) {
    return this.squadService.removeLogo(req.user.userId, id);
  }
}
