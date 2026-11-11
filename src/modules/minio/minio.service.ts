import { randomUUID } from 'crypto';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
// No esModuleInterop in tsconfig: a default import of the CJS `sharp` would be undefined.
import * as sharp from 'sharp';

import { APMO_BUCKET } from './minio.lib';
import { detectImageType } from 'src/shared/utils/file-signature';

type UploadImageOptions = {
  /** Folder inside the bucket, e.g. the user id. */
  prefix?: string;
  /** Static images are resized to fit this square (px) and converted to webp. */
  maxSize?: number;
};

const REGION = 'us-east-1';

/**
 * MinIO file storage (same approach as asp-api).
 *
 * Buckets are public-read, so the stored URL is used directly as `<img src>`.
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  private readonly client: Client;

  private readonly readyBuckets = new Set<APMO_BUCKET>();

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      region: REGION,
      accessKey: process.env.MINIO_ROOT_USER || '',
      secretKey: process.env.MINIO_ROOT_PASSWORD || '',
    });
  }

  onModuleInit() {
    // Do not block the start-up when MinIO is still booting; uploads retry it.
    Promise.all(
      Object.values(APMO_BUCKET).map((bucket) => this.ensureBucket(bucket)),
    ).catch(() => undefined);
  }

  /**
   * Stores an image and returns its public URL.
   * PNG / JPEG / WEBP are resized and converted to webp, GIF is kept as is (animation).
   */
  async uploadImage(
    bucket: APMO_BUCKET,
    buffer: Buffer,
    { prefix, maxSize = 512 }: UploadImageOptions = {},
  ) {
    const type = detectImageType(buffer);

    if (!type) {
      throw new Error('Unsupported image type');
    }

    const isConverted = type.ext !== 'gif';

    const body = isConverted
      ? await sharp(buffer)
          .rotate() // apply EXIF orientation
          .resize(maxSize, maxSize, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer()
      : buffer;

    const ext = isConverted ? 'webp' : type.ext;
    const contentType = isConverted ? 'image/webp' : type.mime;
    const objectName = [prefix, `${randomUUID()}.${ext}`]
      .filter(Boolean)
      .join('/');

    await this.ensureBucket(bucket);

    await this.client.putObject(bucket, objectName, body, body.length, {
      'Content-Type': contentType,
      // Object names are unique per upload, so the content never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return this.buildPublicUrl(bucket, objectName);
  }

  /**
   * Stores an object under a fixed, content-addressed name and returns its public URL.
   * When the object already exists, `getBody` is not called and nothing is uploaded.
   */
  async putImmutableObject(
    bucket: APMO_BUCKET,
    objectName: string,
    contentType: string,
    getBody: () => Promise<Buffer>,
  ) {
    await this.ensureBucket(bucket);

    const exists = await this.client
      .statObject(bucket, objectName)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      const body = await getBody();

      await this.client.putObject(bucket, objectName, body, body.length, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
    }

    return this.buildPublicUrl(bucket, objectName);
  }

  /** Deletes an object by its public URL. Foreign URLs are ignored. */
  async removeByUrl(url?: string | null) {
    const location = this.parsePublicUrl(url);

    if (!location) return;

    try {
      await this.client.removeObject(location.bucket, location.objectName);
    } catch (error) {
      this.logger.warn(`Failed to delete ${url}: ${String(error)}`);
    }
  }

  /**
   * Public base URL of MinIO. `MINIO_PUBLIC_URL` overrides it when MinIO is
   * behind a proxy / another domain (e.g. https://files.example.com).
   */
  private get publicBaseUrl() {
    if (process.env.MINIO_PUBLIC_URL) {
      return process.env.MINIO_PUBLIC_URL.replace(/\/+$/, '');
    }

    const host = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const isSsl = process.env.MINIO_USE_SSL === 'true';
    const isDefaultPort =
      (isSsl && port === '443') || (!isSsl && port === '80');

    return `${isSsl ? 'https' : 'http'}://${host}${isDefaultPort ? '' : `:${port}`}`;
  }

  private buildPublicUrl(bucket: APMO_BUCKET, objectName: string) {
    return `${this.publicBaseUrl}/${bucket}/${objectName}`;
  }

  private parsePublicUrl(url?: string | null) {
    const base = `${this.publicBaseUrl}/`;

    if (!url || !url.startsWith(base)) return null;

    const [bucket, ...rest] = url.slice(base.length).split('?')[0].split('/');
    const objectName = decodeURIComponent(rest.join('/'));

    if (
      !Object.values(APMO_BUCKET).includes(bucket as APMO_BUCKET) ||
      !objectName
    ) {
      return null;
    }

    return { bucket: bucket as APMO_BUCKET, objectName };
  }

  private isBucketAlreadyOwnedError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'BucketAlreadyOwnedByYou'
    );
  }

  private async ensureBucket(bucket: APMO_BUCKET) {
    if (this.readyBuckets.has(bucket)) return;

    try {
      const exists = await this.client.bucketExists(bucket).catch(() => false);

      if (!exists) {
        this.logger.log(`Bucket "${bucket}" not found. Creating...`);

        try {
          await this.client.makeBucket(bucket, REGION);
        } catch (error) {
          if (!this.isBucketAlreadyOwnedError(error)) throw error;
        }
      }

      await this.client.setBucketPolicy(
        bucket,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      );

      this.readyBuckets.add(bucket);
    } catch (error) {
      this.logger.error(`Failed to ensure bucket "${bucket}"`, error);
      throw new Error('Failed to ensure bucket');
    }
  }
}
