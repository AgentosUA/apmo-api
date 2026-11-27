import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
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
import {
  getRemoteMissionConfig,
  resolveRemoteMissionUrl,
} from './remote-mission';

const MISSIONS_DIR = 'public/missions';

/** What the parser needs from an upload (multer file or a downloaded .pbo). */
type MissionFile = Pick<Express.Multer.File, 'originalname' | 'buffer'>;

@Injectable()
export class MissionService {
  constructor(private readonly missionImages: MissionImagesService) {}

  async parseMission(file: MissionFile, isTesting = false) {
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
            // mission.sqm omits zero values.
            hour: intel.hour ?? 0,
            minute: intel.minute ?? 0,
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

  /** Downloads a .pbo from an allow-listed URL and parses it like an upload. */
  async parseMissionFromUrl(value: unknown) {
    const config = getRemoteMissionConfig();
    const resolved = resolveRemoteMissionUrl(value, config.allowlist);

    // `in` narrows without strictNullChecks.
    if ('reason' in resolved) {
      if (resolved.reason === 'not-allowed') {
        throw new ForbiddenException('Mission URL is not allowed');
      }

      throw new BadRequestException(
        resolved.reason === 'not-pbo'
          ? 'Only .pbo files are allowed'
          : 'Invalid mission URL',
      );
    }

    const buffer = await this.downloadMission(resolved.url, config);

    return this.parseMission({ originalname: resolved.fileName, buffer });
  }

  private async downloadMission(
    url: URL,
    { maxSize, timeout }: { maxSize: number; timeout: number },
  ) {
    let response: Response;

    try {
      // No redirects: a redirect could lead outside the allow-list.
      response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error) {
      console.log(error);

      throw new BadGatewayException('Failed to download mission');
    }

    if (!response.ok || !response.body) {
      await response.body?.cancel().catch(() => undefined);

      throw new BadGatewayException(
        `Failed to download mission (HTTP ${response.status})`,
      );
    }

    const tooLarge = () =>
      new PayloadTooLargeException(
        `Mission file is larger than ${Math.round(maxSize / 1024 / 1024)} MB`,
      );

    if (Number(response.headers.get('content-length')) > maxSize) {
      await response.body.cancel().catch(() => undefined);

      throw tooLarge();
    }

    // Content-Length may be missing or wrong: count the bytes while reading.
    const chunks: Uint8Array[] = [];
    let size = 0;

    try {
      for await (const chunk of response.body) {
        size += chunk.byteLength;

        if (size > maxSize) throw tooLarge();

        chunks.push(chunk);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.log(error);

      throw new BadGatewayException('Failed to download mission');
    }

    return Buffer.concat(chunks);
  }
}
