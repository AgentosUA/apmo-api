/** Buckets in the S3 storage (RustFS). Every bucket is publicly readable (see `StorageService.ensureBucket`). */
export enum APMO_BUCKET {
  AVATARS = 'user-avatars',
  SQUAD_LOGOS = 'squad-logos',
  /** Mission images (overview picture, briefing images) converted to webp. */
  MISSION_IMAGES = 'mission-images',
}
