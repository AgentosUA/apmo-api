import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
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
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('isTesting') isTesting: string,
  ) {
    if (!isTesting && !file) throw new BadRequestException('No file uploaded');

    if (!isTesting && !file?.originalname?.endsWith('.pbo')) {
      throw new BadRequestException('Only .pbo files are allowed');
    }

    return this.missionService.parseMission(file, Boolean(isTesting));
  }

  /**
   * Opens a mission by link (`https://arma-plan-maker.com?file=<url>`): the
   * .pbo is downloaded by the API, only from MISSION_URL_ALLOWLIST.
   */
  @Post('/parse-url')
  @HttpCode(200)
  parseUrl(@Body('url') url: unknown) {
    return this.missionService.parseMissionFromUrl(url);
  }
}
