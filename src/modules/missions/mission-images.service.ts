import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

import { Injectable, Logger } from '@nestjs/common';
// No esModuleInterop in tsconfig: a default import of the CJS `sharp` would be undefined.
import * as sharp from 'sharp';

import { MinioService } from '../minio/minio.service';
import { APMO_BUCKET } from '../minio/minio.lib';
import { resolveMissionFile } from 'src/shared/utils/file';
import { detectImageType } from 'src/shared/utils/file-signature';
import { decodePaa } from 'src/shared/utils/paa';

/** Images are downscaled to fit this box (px), never upscaled. */
const MAX_SIZE = 2048;
const WEBP_QUALITY = 85;
/** Bump to re-convert images that are already stored (changes object names). */
const CONVERSION_VERSION = 'v1';

/**
 * Mission images (overview picture, briefing `<img>`): `.paa`, `.jpg`, `.png`
 * are converted to webp and stored in MinIO, so the UI gets plain URLs
 * instead of base64 data.
 */
@Injectable()
export class MissionImagesService {
  private readonly logger = new Logger(MissionImagesService.name);

  constructor(private readonly minio: MinioService) {}

  /**
   * Uploads the images referenced by the mission.
   * Returns a map: path as written in the mission → public URL.
   * Missing or broken images are skipped (logged), they never fail the import.
   */
  async upload(missionPath: string, paths: string[]) {
    const urls = new Map<string, string>();
    const unique = [...new Set(paths.filter(Boolean))];

    await Promise.all(
      unique.map(async (path) => {
        try {
          const url = await this.uploadOne(missionPath, path);

          if (url) urls.set(path, url);
        } catch (error) {
          this.logger.warn(
            `Failed to store mission image "${path}": ${String(error)}`,
          );
        }
      }),
    );

    return urls;
  }

  private async uploadOne(missionPath: string, path: string) {
    const filePath = resolveMissionFile(missionPath, path);

    if (!filePath) {
      this.logger.warn(`Mission image not found: "${path}"`);

      return null;
    }

    const source = await readFile(filePath);

    // Content-addressed: the same image from any mission is stored once.
    const hash = createHash('sha256')
      .update(CONVERSION_VERSION)
      .update(source)
      .digest('hex');

    return this.minio.putImmutableObject(
      APMO_BUCKET.MISSION_IMAGES,
      `${hash.slice(0, 2)}/${hash}.webp`,
      'image/webp',
      () => toWebp(source),
    );
  }
}

/** PAA (Arma texture) or a regular image (jpg / png / webp / gif) → webp. */
const toWebp = (source: Buffer) => {
  let image: sharp.Sharp;

  if (detectImageType(source)) {
    image = sharp(source);
  } else {
    // PAA has no signature: if it is not a known image, it must be a PAA.
    const { width, height, data } = decodePaa(source);

    image = sharp(data, { raw: { width, height, channels: 4 } });
  }

  return image
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
};
