import { Module } from '@nestjs/common';

import { MissionImagesService } from './mission-images.service';
import { MissionService } from './mission.service';
import { MissionController } from './missions.controller';

@Module({
  imports: [],
  controllers: [MissionController],
  providers: [MissionService, MissionImagesService],
})
export class MissionModule {}
