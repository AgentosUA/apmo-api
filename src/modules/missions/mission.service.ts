import { execSync } from 'child_process';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import * as fs from 'fs';

import { Entities } from 'src/shared/types/sqm';
import { getDiaryContent, getGroupsFromEntity } from './lib';
import { generateRandomString } from 'src/shared/utils/string';

@Injectable()
export class MissionService {
  async parseMission(file: Express.Multer.File) {
    const fileId = generateRandomString();

    try {
      fs.writeFileSync(`public/missions/${fileId}.pbo`, file.buffer);

      execSync(`cd public/missions && extractpbo ${fileId}.pbo`);

      if (!fs.existsSync(`public/missions/${fileId}/mission.sqm`)) {
        console.log('ERROR HERE');
      }

      execSync(
        `cp public/parse2json public/missions/${fileId} && cd public/missions/${fileId} && ./parse2json mission.sqm mission.json`,
      );

      const missionPath = `public/missions/${fileId}/mission.json`;
      const briefingPath = `public/missions/${fileId}/briefing.sqm`;

      const data = JSON.parse(fs.readFileSync(missionPath, 'utf-8'));

      const intel = data.Mission.Intel;
      const entities = data.Mission.Entities as Entities;
      let diary = [];

      if (fs.existsSync(briefingPath)) {
        const briefingFile = fs.readFileSync(briefingPath, 'utf-8');
        diary = getDiaryContent(briefingFile);
      }

      const groups = getGroupsFromEntity(entities);

      return {
        fileName: data.sourceName,
        missionNamme: intel.briefingName,
        author: data.ScenarioData.author,
        preview: {
          text: data.ScenarioData.overviewText,
          image: data.ScenarioData.overViewPicture,
        },
        dlcs: data.dlcs,
        briefing: {
          diary,
          intel: {
            overviewText: intel.overviewText,
            year: intel.year,
            month: intel.month,
            day: intel.day,
            hour: intel.hour,
            minute: intel.minute,
            // fog?
          },
        },
        groups,
        vehicles: entities.Vehicles,
        fullObject: data,
      };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        'Failed to upload mission',
        HttpStatus.I_AM_A_TEAPOT,
      );
    } finally {
      fs.rmSync(`public/missions/${fileId}.pbo`);
      fs.rmSync(`public/missions/${fileId}`, { recursive: true });
    }
  }
}
