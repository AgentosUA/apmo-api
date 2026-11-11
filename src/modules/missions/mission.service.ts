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
  getBriefingImagePaths,
  getDiaryContent,
  getGroupsFromEntity,
  getMarkersFromEntity,
  getVehicles,
  normalizeBriefing,
} from './lib';
import { MissionImagesService } from './mission-images.service';
import {
  generateRandomString,
  removeExtraSlashes,
} from 'src/shared/utils/string';

@Injectable()
export class MissionService {
  constructor(private readonly missionImages: MissionImagesService) {}

  async parseMission(file: Express.Multer.File, isTesting = false) {
    const fileId = isTesting ? 'playground' : generateRandomString();
    // Island comes from the file name (`name.Island.pbo`): checked first, so a
    // bad name fails before any work (and image uploads) is done.
    const island = isTesting
      ? 'Altis'
      : file?.originalname?.split?.('.pbo')?.[0]?.split('.')?.[1];

    try {
      if (!island) throw new BadRequestException();

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
      const overviewPicture = data.ScenarioData?.overViewPicture
        ? removeExtraSlashes(data.ScenarioData.overViewPicture)
        : '';
      const briefing = fs.existsSync(briefingPath)
        ? normalizeBriefing(fs.readFileSync(briefingPath, 'utf-8'))
        : '';

      // .paa / .jpg / .png → webp in MinIO; the UI receives URLs.
      const imageUrls = await this.missionImages.upload(missionPath, [
        overviewPicture,
        ...getBriefingImagePaths(briefing),
      ]);

      const previewImage = imageUrls.get(overviewPicture) ?? '';
      const diary = briefing ? getDiaryContent(briefing, imageUrls) : [];

      const groups = getGroupsFromEntity(entities);
      const markers = getMarkersFromEntity(entities);
      const vehicles = getVehicles(entities);

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
          // `force`: the files may not exist when the import failed early.
          fs.rmSync(`public/missions/${fileId}.pbo`, { force: true });
          fs.rmSync(`public/missions/${fileId}`, {
            recursive: true,
            force: true,
          });
        }, 10000);
      }
    }
  }
}
