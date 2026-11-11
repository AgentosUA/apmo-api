import { decodeDxt, dxtDataSize, type DxtFormat } from './dxt';
import { lzo1xDecompress } from './lzo';
import { lzssDecompress } from './lzss';

/**
 * Arma PAA texture decoder → raw RGBA of the largest mipmap.
 *
 * Format: https://community.bistudio.com/wiki/PAA_File_Format
 *   u16 type | TAGG* ("GGAT" + name + u32 size + data) | u16 palette count + RGB palette |
 *   mipmaps: u16 width (bit 15 = LZO), u16 height, u24 size, data … terminated by 0×0.
 */

type PixelFormat = DxtFormat | 'ARGB4444' | 'ARGB1555' | 'ARGB8888' | 'AI88';

const FORMATS: Record<number, PixelFormat> = {
  0xff01: 'DXT1',
  // DXT2/DXT4 are the premultiplied variants of DXT3/DXT5.
  0xff02: 'DXT3',
  0xff03: 'DXT3',
  0xff04: 'DXT5',
  0xff05: 'DXT5',
  0x4444: 'ARGB4444',
  0x1555: 'ARGB1555',
  0x8888: 'ARGB8888',
  0x8080: 'AI88',
};

const BYTES_PER_PIXEL: Record<Exclude<PixelFormat, DxtFormat>, number> = {
  ARGB4444: 2,
  ARGB1555: 2,
  ARGB8888: 4,
  AI88: 2,
};

const MAX_DIMENSION = 8192;

const isDxt = (format: PixelFormat): format is DxtFormat =>
  format.startsWith('DXT');

export type DecodedImage = {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel. */
  data: Buffer;
};

/** Quick check by the type tag (PAA has no magic signature). */
export const isPaa = (buffer: Buffer) =>
  buffer.length >= 2 && buffer.readUInt16LE(0) in FORMATS;

const decodeRaw = (
  format: Exclude<PixelFormat, DxtFormat>,
  data: Buffer,
  pixels: number,
) => {
  const rgba = Buffer.alloc(pixels * 4);

  for (let i = 0; i < pixels; i++) {
    const o = i * 4;

    switch (format) {
      case 'ARGB8888':
        // Stored as B, G, R, A.
        rgba[o] = data[i * 4 + 2];
        rgba[o + 1] = data[i * 4 + 1];
        rgba[o + 2] = data[i * 4];
        rgba[o + 3] = data[i * 4 + 3];
        break;

      case 'ARGB4444': {
        const v = data.readUInt16LE(i * 2);

        rgba[o] = ((v >> 8) & 0xf) * 17;
        rgba[o + 1] = ((v >> 4) & 0xf) * 17;
        rgba[o + 2] = (v & 0xf) * 17;
        rgba[o + 3] = ((v >> 12) & 0xf) * 17;
        break;
      }

      case 'ARGB1555': {
        const v = data.readUInt16LE(i * 2);
        const r = (v >> 10) & 0x1f;
        const g = (v >> 5) & 0x1f;
        const b = v & 0x1f;

        rgba[o] = (r << 3) | (r >> 2);
        rgba[o + 1] = (g << 3) | (g >> 2);
        rgba[o + 2] = (b << 3) | (b >> 2);
        rgba[o + 3] = v & 0x8000 ? 255 : 0;
        break;
      }

      case 'AI88':
        // Grayscale with alpha: intensity, alpha.
        rgba[o] = rgba[o + 1] = rgba[o + 2] = data[i * 2];
        rgba[o + 3] = data[i * 2 + 1];
        break;
    }
  }

  return rgba;
};

export const decodePaa = (buffer: Buffer): DecodedImage => {
  let offset = 0;

  const ensure = (bytes: number) => {
    if (offset + bytes > buffer.length)
      throw new Error('PAA: unexpected end of file');
  };

  ensure(2);

  const format = FORMATS[buffer.readUInt16LE(offset)];

  if (!format) throw new Error('PAA: unknown texture type');

  offset += 2;

  // TAGGs (average colour, offsets, swizzle…): not needed for decoding.
  while (buffer.toString('latin1', offset, offset + 4) === 'GGAT') {
    ensure(12);

    offset += 12 + buffer.readUInt32LE(offset + 8);
  }

  // Palette (unused by the supported formats).
  ensure(2);
  offset += 2 + buffer.readUInt16LE(offset) * 3;

  // The first mipmap is the largest one.
  ensure(7);

  const rawWidth = buffer.readUInt16LE(offset);
  const height = buffer.readUInt16LE(offset + 2);
  const size = buffer.readUIntLE(offset + 4, 3);
  const isLzo = (rawWidth & 0x8000) !== 0;
  const width = rawWidth & 0x7fff;

  offset += 7;

  if (!width || !height) throw new Error('PAA: no mipmaps');

  // Arma itself caps textures at 8192 px; also guards against huge allocations.
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`PAA: ${width}x${height} is too large`);
  }

  ensure(size);

  const stored = buffer.subarray(offset, offset + size);

  if (isDxt(format)) {
    const expected = dxtDataSize(format, width, height);
    const blocks = isLzo ? lzo1xDecompress(stored, expected) : stored;

    return { width, height, data: decodeDxt(format, blocks, width, height) };
  }

  const expected = width * height * BYTES_PER_PIXEL[format];
  // Raw data has exactly the expected size, anything else is LZSS (+ checksum).
  const pixels = size === expected ? stored : lzssDecompress(stored, expected);

  return { width, height, data: decodeRaw(format, pixels, width * height) };
};
