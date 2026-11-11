/** Image formats accepted for avatars. */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type ImageType = {
  mime: (typeof IMAGE_MIME_TYPES)[number];
  ext: 'jpg' | 'png' | 'gif' | 'webp';
};

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Image type from the file content (magic bytes). Never trusts the MIME type
 * or the extension sent by the client.
 */
export const detectImageType = (buffer?: Buffer | null): ImageType | null => {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { mime: 'image/png', ext: 'png' };
  }

  const gif = buffer.subarray(0, 6).toString('ascii');

  if (gif === 'GIF87a' || gif === 'GIF89a') {
    return { mime: 'image/gif', ext: 'gif' };
  }

  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
};
