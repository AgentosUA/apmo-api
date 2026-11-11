/**
 * LZO1X decompressor (port of `lzo1x_decompress_safe`).
 *
 * Used by PAA DXT mipmaps: when the top bit of the mipmap width is set, the
 * block data is LZO1X compressed.
 */
export const lzo1xDecompress = (input: Uint8Array, outLength: number) => {
  const out = Buffer.alloc(outLength);

  let ip = 0;
  let op = 0;
  let t = 0;

  const fail = (reason: string): never => {
    throw new Error(`LZO: ${reason}`);
  };

  const byte = () => {
    if (ip >= input.length) fail('input overrun');

    return input[ip++];
  };

  /** Long length encoding: zero bytes add 255 each, then the last byte + base. */
  const readLength = (value: number, base: number) => {
    if (value !== 0) return value;

    let length = 0;

    while (input[ip] === 0) {
      length += 255;
      ip++;

      if (ip >= input.length) fail('input overrun');
    }

    return length + base + byte();
  };

  const copyLiterals = (count: number) => {
    if (ip + count > input.length) fail('input overrun');
    if (op + count > outLength) fail('output overrun');

    out.set(input.subarray(ip, ip + count), op);
    ip += count;
    op += count;
  };

  const copyMatch = (position: number, count: number) => {
    if (position < 0 || position >= op) fail('lookbehind overrun');
    if (op + count > outLength) fail('output overrun');

    // Byte by byte: a match may overlap the bytes it produces.
    for (let i = 0; i < count; i++) out[op++] = out[position++];
  };

  type State = 'loop' | 'firstLiteralRun' | 'match' | 'matchDone' | 'matchNext';

  let state: State = 'loop';

  if (input[0] > 17) {
    t = byte() - 17;

    if (t < 4) {
      state = 'matchNext';
    } else {
      copyLiterals(t);
      state = 'firstLiteralRun';
    }
  }

  for (;;) {
    switch (state) {
      case 'loop': {
        t = byte();

        if (t >= 16) {
          state = 'match';
          break;
        }

        copyLiterals(readLength(t, 15) + 3);
        state = 'firstLiteralRun';
        break;
      }

      case 'firstLiteralRun': {
        t = byte();

        if (t >= 16) {
          state = 'match';
          break;
        }

        copyMatch(op - 0x801 - (t >> 2) - (byte() << 2), 3);
        state = 'matchDone';
        break;
      }

      case 'match': {
        if (t >= 64) {
          // M2: 3..8 bytes, distance up to 2 KiB
          const position = op - 1 - ((t >> 2) & 7) - (byte() << 3);

          copyMatch(position, (t >> 5) + 1);
        } else if (t >= 32) {
          // M3: distance up to 16 KiB
          const length = readLength(t & 31, 31);
          const distance = (byte() | (byte() << 8)) >> 2;

          copyMatch(op - 1 - distance, length + 2);
        } else if (t >= 16) {
          // M4: distance 16..48 KiB, or the end-of-stream marker
          let position = op - ((t & 8) << 11);
          const length = readLength(t & 7, 7);

          position -= (byte() | (byte() << 8)) >> 2;

          if (position === op) {
            if (op !== outLength) fail('unexpected end of stream');

            return out;
          }

          copyMatch(position - 0x4000, length + 2);
        } else {
          // M1: 2 bytes, right after a match
          copyMatch(op - 1 - (t >> 2) - (byte() << 2), 2);
        }

        state = 'matchDone';
        break;
      }

      case 'matchDone': {
        t = input[ip - 2] & 3;
        state = t === 0 ? 'loop' : 'matchNext';
        break;
      }

      case 'matchNext': {
        copyLiterals(t);
        t = byte();
        state = 'match';
        break;
      }
    }
  }
};
