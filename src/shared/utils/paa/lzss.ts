/**
 * Bohemia Interactive LZSS decompressor.
 *
 * Used by PAA ARGB/AI88 mipmaps whose stored size is smaller than the raw size.
 * Format: a flag byte, then 8 items; bit = 1 → literal byte, bit = 0 → a
 * 2-byte back reference (12-bit distance back from the current position,
 * 4-bit length + 3). Positions before the start of the output read as spaces.
 * The stream is followed by a 4-byte checksum, which is not needed here.
 */
export const lzssDecompress = (input: Uint8Array, outLength: number) => {
  const out = Buffer.alloc(outLength);

  let ip = 0;
  let op = 0;

  const byte = () => {
    if (ip >= input.length) throw new Error('LZSS: input overrun');

    return input[ip++];
  };

  while (op < outLength) {
    let flags = byte();

    for (let bit = 0; bit < 8 && op < outLength; bit++, flags >>= 1) {
      if (flags & 1) {
        out[op++] = byte();
        continue;
      }

      const low = byte();
      const high = byte();
      const distance = low | ((high & 0xf0) << 4);
      let length = (high & 0x0f) + 3;
      let position = op - distance;

      if (op + length > outLength) length = outLength - op;

      for (; length > 0; length--, position++) {
        out[op++] = position < 0 ? 0x20 : out[position];
      }
    }
  }

  return out;
};
