import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionModule } from './modules/missions/missions.module';
import { PlanModule } from './modules/plans/plan.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    PlanModule,
    MissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
