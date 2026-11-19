import { randomUUID } from 'crypto';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// No esModuleInterop in tsconfig: a default import of the CJS `sharp` would be undefined.
import * as sharp from 'sharp';

import { APMO_BUCKET } from './storage.lib';
import { detectImageType } from 'src/shared/utils/file-signature';

type UploadImageOptions = {
  /** Folder inside the bucket, e.g. the user id. */
  prefix?: string;
  /** Static images are resized to fit this square (px) and converted to webp. */
  maxSize?: number;
};

/** Object names are unique / content-addressed, so the content never changes. */
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const DEFAULT_ENDPOINT = 'http://localhost:9000';

/**
 * S3-compatible file storage (RustFS), accessed with the standard AWS SDK.
 *
 * Buckets are public-read, so the stored URL is used directly as `<img src>`.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private readonly client: S3Client;

  private readonly readyBuckets = new Set<APMO_BUCKET>();

  constructor() {
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      // RustFS serves buckets as paths: http://host:9000/<bucket>/<object>.
      forcePathStyle: true,
      // Send/verify checksums only when an operation requires them: the SDK's
      // default CRC32 headers are not supported by every S3-compatible server.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  onModuleInit() {
    // Do not block the start-up when the storage is still booting; uploads retry it.
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
    await this.putObject(bucket, objectName, body, contentType);

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
      .send(new HeadObjectCommand({ Bucket: bucket, Key: objectName }))
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      await this.putObject(bucket, objectName, await getBody(), contentType);
    }

    return this.buildPublicUrl(bucket, objectName);
  }

  /** Deletes an object by its public URL. Foreign URLs are ignored. */
  async removeByUrl(url?: string | null) {
    const location = this.parsePublicUrl(url);

    if (!location) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: location.bucket,
          Key: location.objectName,
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete ${url}: ${String(error)}`);
    }
  }

  private putObject(
    bucket: APMO_BUCKET,
    objectName: string,
    body: Buffer,
    contentType: string,
  ) {
    return this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectName,
        Body: body,
        ContentLength: body.length,
        ContentType: contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
      }),
    );
  }

  /** S3 API endpoint the API talks to, e.g. http://rustfs:9000 inside docker compose. */
  private get endpoint() {
    return (process.env.S3_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/+$/, '');
  }

  /**
   * Public base URL of the storage. `S3_PUBLIC_URL` overrides it when RustFS is
   * behind a proxy / another domain (e.g. https://files.example.com).
   */
  private get publicBaseUrl() {
    return (process.env.S3_PUBLIC_URL || this.endpoint).replace(/\/+$/, '');
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

  private isBucketAlreadyCreatedError(error: unknown) {
    return (
      error instanceof S3ServiceException &&
      ['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)
    );
  }

  private async bucketExists(bucket: APMO_BUCKET) {
    return this.client
      .send(new HeadBucketCommand({ Bucket: bucket }))
      .then(() => true)
      .catch(() => false);
  }

  private async ensureBucket(bucket: APMO_BUCKET) {
    if (this.readyBuckets.has(bucket)) return;

    try {
      if (!(await this.bucketExists(bucket))) {
        this.logger.log(`Bucket "${bucket}" not found. Creating...`);

        try {
          await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (error) {
          if (!this.isBucketAlreadyCreatedError(error)) throw error;
        }
      }

      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
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
        }),
      );

      this.readyBuckets.add(bucket);
    } catch (error) {
      this.logger.error(`Failed to ensure bucket "${bucket}"`, error);
      throw new Error('Failed to ensure bucket');
    }
  }
}
