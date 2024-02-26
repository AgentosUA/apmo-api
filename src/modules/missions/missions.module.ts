import { Module } from '@nestjs/common';

import { MissionService } from './mission.service';
import { MissionController } from './missions.controller';

@Module({
  imports: [],
  controllers: [MissionController],
  providers: [MissionService],
})
export class MissionModule {}
