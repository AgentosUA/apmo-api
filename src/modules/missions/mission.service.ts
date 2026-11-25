import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { readFile, rm } from 'fs/promises';

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
import { resolveMissionFile } from 'src/shared/utils/file';
import { PboArchive, parseConfigFile } from 'src/shared/utils/pbo';

const MISSIONS_DIR = 'public/missions';

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

      const missionPath = `${MISSIONS_DIR}/${fileId}`;

      if (!isTesting) {
        // Unpacked in-process (no native tools): works on any CPU architecture.
        const pbo = PboArchive.fromBuffer(file.buffer);

        if (!pbo.has('mission.sqm')) {
          throw new HttpException(
            'Failed to upload mission',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await pbo.extractTo(missionPath);
      }

      // Arma paths are case-insensitive (`Mission.sqm`, `Briefing.sqf`…).
      const sqmPath = resolveMissionFile(missionPath, 'mission.sqm');
      const briefingPath = resolveMissionFile(missionPath, 'briefing.sqf');

      if (!sqmPath) {
        throw new HttpException(
          'Failed to upload mission',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // mission.sqm can be text or binarized (raP): both are parsed to JSON.
      const data = parseConfigFile(await readFile(sqmPath)) as any;

      const intel = data.Mission.Intel;
      const entities = data.Mission.Entities as Entities;
      const overviewPicture = data.ScenarioData?.overViewPicture
        ? removeExtraSlashes(data.ScenarioData.overViewPicture)
        : '';
      const briefing = briefingPath
        ? normalizeBriefing(await readFile(briefingPath, 'utf-8'))
        : '';

      // .paa / .jpg / .png → webp in RustFS (S3); the UI receives URLs.
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
          rm(`${MISSIONS_DIR}/${fileId}`, {
            recursive: true,
            force: true,
          }).catch((error) => console.log(error));
        }, 10000);
      }
    }
  }
}
