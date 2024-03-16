import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { MissionService } from './mission.service';

@Controller('/missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post('/parse')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (!file.originalname.endsWith('.pbo'))
      throw new BadRequestException('Only .pbo files are allowed');

    return this.missionService.parseMission(file);
  }
}
