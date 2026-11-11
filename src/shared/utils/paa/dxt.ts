/** S3TC (DXT1/3/5) block decoders. Output is RGBA, 4 bytes per pixel. */

export type DxtFormat = 'DXT1' | 'DXT3' | 'DXT5';

const BLOCK_SIZE: Record<DxtFormat, number> = { DXT1: 8, DXT3: 16, DXT5: 16 };

export const dxtDataSize = (format: DxtFormat, width: number, height: number) =>
  Math.max(1, Math.ceil(width / 4)) *
  Math.max(1, Math.ceil(height / 4)) *
  BLOCK_SIZE[format];

const rgb565 = (value: number): [number, number, number] => {
  const r = (value >> 11) & 0x1f;
  const g = (value >> 5) & 0x3f;
  const b = value & 0x1f;

  return [(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 3)];
};

/** 16 RGBA colours of a colour block (the DXT1 block, also the 2nd half of DXT3/5). */
const decodeColorBlock = (
  data: Uint8Array,
  offset: number,
  isDxt1: boolean,
  target: Uint8Array,
) => {
  const c0 = data[offset] | (data[offset + 1] << 8);
  const c1 = data[offset + 2] | (data[offset + 3] << 8);
  const [r0, g0, b0] = rgb565(c0);
  const [r1, g1, b1] = rgb565(c1);

  const palette = new Uint8Array(16);

  palette.set([r0, g0, b0, 255, r1, g1, b1, 255]);

  if (!isDxt1 || c0 > c1) {
    palette.set(
      [
        (2 * r0 + r1) / 3,
        (2 * g0 + g1) / 3,
        (2 * b0 + b1) / 3,
        255,
        (r0 + 2 * r1) / 3,
        (g0 + 2 * g1) / 3,
        (b0 + 2 * b1) / 3,
        255,
      ],
      8,
    );
  } else {
    // 3-colour mode with 1-bit alpha: index 3 is transparent black.
    palette.set(
      [(r0 + r1) / 2, (g0 + g1) / 2, (b0 + b1) / 2, 255, 0, 0, 0, 0],
      8,
    );
  }

  for (let i = 0; i < 16; i++) {
    const index = (data[offset + 4 + (i >> 2)] >> ((i & 3) * 2)) & 3;

    target.set(palette.subarray(index * 4, index * 4 + 4), i * 4);
  }
};

const decodeDxt3Alpha = (
  data: Uint8Array,
  offset: number,
  target: Uint8Array,
) => {
  for (let i = 0; i < 16; i++) {
    const nibble = (data[offset + (i >> 1)] >> ((i & 1) * 4)) & 0x0f;

    target[i * 4 + 3] = nibble * 17;
  }
};

const decodeDxt5Alpha = (
  data: Uint8Array,
  offset: number,
  target: Uint8Array,
) => {
  const a0 = data[offset];
  const a1 = data[offset + 1];
  const alphas = [a0, a1];

  if (a0 > a1) {
    for (let i = 1; i <= 6; i++)
      alphas.push(Math.round(((7 - i) * a0 + i * a1) / 7));
  } else {
    for (let i = 1; i <= 4; i++)
      alphas.push(Math.round(((5 - i) * a0 + i * a1) / 5));
    alphas.push(0, 255);
  }

  // 48 bits of 3-bit indices, little endian.
  let bits = 0;
  let bitCount = 0;
  let byteIndex = offset + 2;

  for (let i = 0; i < 16; i++) {
    if (bitCount < 3) {
      bits |= data[byteIndex++] << bitCount;
      bitCount += 8;
    }

    target[i * 4 + 3] = alphas[bits & 7];
    bits >>= 3;
    bitCount -= 3;
  }
};

export const decodeDxt = (
  format: DxtFormat,
  data: Uint8Array,
  width: number,
  height: number,
) => {
  const rgba = Buffer.alloc(width * height * 4);
  const block = new Uint8Array(64);
  const blocksX = Math.max(1, Math.ceil(width / 4));
  const blocksY = Math.max(1, Math.ceil(height / 4));
  const blockSize = BLOCK_SIZE[format];

  if (data.length < blocksX * blocksY * blockSize) {
    throw new Error(`${format}: not enough data`);
  }

  let offset = 0;

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++, offset += blockSize) {
      if (format === 'DXT1') {
        decodeColorBlock(data, offset, true, block);
      } else {
        decodeColorBlock(data, offset + 8, false, block);

        if (format === 'DXT3') decodeDxt3Alpha(data, offset, block);
        else decodeDxt5Alpha(data, offset, block);
      }

      for (let py = 0; py < 4; py++) {
        const y = by * 4 + py;

        if (y >= height) break;

        for (let px = 0; px < 4; px++) {
          const x = bx * 4 + px;

          if (x >= width) break;

          const source = (py * 4 + px) * 4;

          rgba.set(block.subarray(source, source + 4), (y * width + x) * 4);
        }
      }
    }
  }

  return rgba;
};
