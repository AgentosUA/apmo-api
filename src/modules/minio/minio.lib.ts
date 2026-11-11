/** Buckets in MinIO. Every bucket is publicly readable (see `MinioService.ensureBucket`). */
export enum APMO_BUCKET {
  AVATARS = 'user-avatars',
  SQUAD_LOGOS = 'squad-logos',
  /** Mission images (overview picture, briefing images) converted to webp. */
  MISSION_IMAGES = 'mission-images',
}
