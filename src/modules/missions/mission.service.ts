import { execSync } from 'child_process';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as fs from 'fs';

import { Entities } from 'src/shared/types/sqm';
import {
  getDiaryContent,
  getGroupsFromEntity,
  getMarkersFromEntity,
  getVehicles,
} from './lib';
import {
  generateRandomString,
  removeExtraSlashes,
} from 'src/shared/utils/string';
import { fileToBase64 } from 'src/shared/utils/file';

@Injectable()
export class MissionService {
  async parseMission(file: Express.Multer.File, isTesting = false) {
    const fileId = isTesting ? 'playground' : generateRandomString();
    let island = '';

    try {
      if (!isTesting) {
        fs.writeFileSync(`public/missions/${fileId}.pbo`, file.buffer);

        execSync(`cd public/missions && extractpbo ${fileId}.pbo`);

        if (!fs.existsSync(`public/missions/${fileId}/mission.sqm`)) {
          throw new HttpException(
            'Failed to upload mission',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        execSync(
          `cp public/parse2json public/missions/${fileId} && cd public/missions/${fileId} && ./parse2json mission.sqm mission.json`,
        );
      }

      const missionPath = `public/missions/${fileId}`;
      const missionJSONPath = `public/missions/${fileId}/mission.json`;
      const briefingPath = `public/missions/${fileId}/briefing.sqf`;

      const data = JSON.parse(fs.readFileSync(missionJSONPath, 'utf-8'));

      const intel = data.Mission.Intel;
      const entities = data.Mission.Entities as Entities;
      let diary = [];
      let previewImage = '';

      if (
        data.ScenarioData.overViewPicture &&
        fs.existsSync(
          removeExtraSlashes(
            `public/missions/${fileId}/${data.ScenarioData.overViewPicture}`,
          ),
        )
      ) {
        previewImage = fileToBase64(
          removeExtraSlashes(
            `public/missions/${fileId}/${data.ScenarioData.overViewPicture}`,
          ),
        );
      }

      if (fs.existsSync(briefingPath)) {
        const briefingFile = fs.readFileSync(briefingPath, 'utf-8');

        diary = getDiaryContent(missionPath, briefingFile);
      }

      const groups = getGroupsFromEntity(entities);
      const markers = getMarkersFromEntity(entities);
      const vehicles = getVehicles(entities);

      island = isTesting
        ? 'Altis'
        : file?.originalname?.split?.('.pbo')?.[0]?.split('.')?.[1];

      if (!island) throw new BadRequestException();

      return {
        fileName:
          data.sourceName ??
          file.originalname.replaceAll('.pbo', '').replaceAll('.PBO', ''),
        missionName: intel.briefingName,
        author: data.ScenarioData.author,
        island,
        preview: {
          text: data.ScenarioData.overviewText,
          image: previewImage,
        },
        dlcs: data.dlcs ?? data.addons ?? null,
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
        markers,
        groups,
        vehicles,
        // fullObject: data,
      };
    } catch (error) {
      console.log(error);

      if (!island) {
        throw new BadRequestException('Island not found in file name');
      }

      throw new HttpException(
        'Failed to upload mission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      if (!isTesting) {
        setTimeout(() => {
          fs.rmSync(`public/missions/${fileId}.pbo`);
          fs.rmSync(`public/missions/${fileId}`, { recursive: true });
        }, 10000);
      }
    }
  }
}
