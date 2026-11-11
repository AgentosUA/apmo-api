import { readFileSync } from 'fs';
import { join } from 'path';

import { decodePaa } from './index';

/*
 * Fixtures: DXT blocks encoded by Pillow, LZO compressed by liblzo2
 * (lzo1x_1_compress); `*.rgba` are Pillow's decodes of the same blocks.
 * `source.rgba` is the 30×21 image the small fixtures were made from.
 */
const fixture = (name: string) =>
  readFileSync(join(__dirname, '__fixtures__', name));

const maxDifference = (a: Buffer, b: Buffer) => {
  expect(a.length).toBe(b.length);

  let max = 0;

  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));

  return max;
};

describe('decodePaa', () => {
  it.each([
    ['dxt1_lzo.paa', 'dxt1.rgba', 30, 21],
    ['dxt3.paa', 'dxt3.rgba', 30, 21],
    ['dxt5_lzo.paa', 'dxt5.rgba', 30, 21],
    ['noise_dxt5_lzo.paa', 'noise_dxt5.rgba', 64, 64],
  ])('decodes %s', (paa, reference, width, height) => {
    const image = decodePaa(fixture(paa));

    expect(image.width).toBe(width);
    expect(image.height).toBe(height);
    // Encoders differ only in the rounding of interpolated colours.
    expect(maxDifference(image.data, fixture(reference))).toBeLessThanOrEqual(
      4,
    );
  });

  it('decodes ARGB8888 losslessly', () => {
    const image = decodePaa(fixture('argb8888.paa'));

    expect(image.data.equals(fixture('source.rgba'))).toBe(true);
  });

  it('decodes LZSS compressed ARGB4444', () => {
    const image = decodePaa(fixture('argb4444_lzss.paa'));
    const quantized = Buffer.from(
      fixture('source.rgba').map((v) => (v >> 4) * 17),
    );

    expect(image.data.equals(quantized)).toBe(true);
  });

  it('rejects files that are not PAA', () => {
    expect(() => decodePaa(Buffer.from('not a texture'))).toThrow();
  });

  it('rejects truncated files', () => {
    const paa = fixture('dxt5_lzo.paa');

    expect(() => decodePaa(paa.subarray(0, paa.length - 300))).toThrow();
  });
});
