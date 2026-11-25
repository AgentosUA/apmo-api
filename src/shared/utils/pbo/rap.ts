import {
  ConfigClass,
  ConfigValue,
  MAX_CONFIG_DEPTH,
  float32ToNumber,
} from './config.types';

/**
 * Debinarizer for rapified configs (`\0raP`), a replacement for Mikero's
 * `derap`. Returns the config as JSON directly (same shape as the text parser).
 *
 * Layout (all little-endian):
 *   "\0raP", uint32 0, uint32 8, uint32 enumOffset
 *   class body: asciiz parentName, compressedInt entryCount, entries
 *   entry: byte type
 *     0 class          asciiz name, uint32 bodyOffset (absolute)
 *     1 value          byte subtype, asciiz name, value(subtype)
 *     2 array          asciiz name, array
 *     3 extern class   asciiz name
 *     4 delete class   asciiz name
 *     5 array += / -=  uint32 flag, asciiz name, array
 *   array: compressedInt count, then per item: byte subtype, value(subtype)
 *   subtypes: 0 string, 1 float32, 2 int32, 3 nested array, 4 variable
 *             (asciiz), 6 int64
 *   compressedInt: 7 bits per byte, low bits first, high bit = "more".
 */

const RAP_SIGNATURE = Buffer.from([0x00, 0x72, 0x61, 0x50]); // \0raP

export const isRapified = (buffer: Buffer) =>
  buffer.length >= 16 && buffer.subarray(0, 4).equals(RAP_SIGNATURE);

export const derap = (buffer: Buffer): ConfigClass => {
  if (!isRapified(buffer)) throw new Error('raP: not a rapified file');

  return new RapReader(buffer).readClassBody(16, 0, new Set());
};

class RapReader {
  private offset = 0;
  private bodies = 0;

  constructor(private readonly buffer: Buffer) {}

  readClassBody(offset: number, depth: number, path: Set<number>): ConfigClass {
    if (depth > MAX_CONFIG_DEPTH) throw new Error('raP: nesting is too deep');
    // A body offset that points back to one of its parents would loop forever.
    if (path.has(offset)) throw new Error('raP: circular class reference');
    // Many classes sharing one body could blow up the output exponentially.
    if (++this.bodies > this.buffer.length) {
      throw new Error('raP: too many class bodies');
    }

    this.seek(offset);
    this.string(); // parent class name: inheritance is not resolved
    const count = this.compressedInt();
    const result: ConfigClass = {};
    const children: [string, number][] = [];

    for (let i = 0; i < count; i++) {
      const type = this.byte();

      switch (type) {
        case 0: {
          const name = this.string();
          children.push([name, this.uint32()]);
          // keeps the key order of the original file
          result[name] = {};
          break;
        }
        case 1: {
          const subtype = this.byte();
          const name = this.string();
          result[name] = this.scalar(subtype);
          break;
        }
        case 2: {
          const name = this.string();
          result[name] = this.array(depth + 1);
          break;
        }
        case 3: {
          const name = this.string();
          if (!(name in result)) result[name] = {};
          break;
        }
        case 4: {
          delete result[this.string()];
          break;
        }
        case 5: {
          const flag = this.uint32();
          const name = this.string();
          const items = this.array(depth + 1);
          const current = Array.isArray(result[name]) ? result[name] : [];
          result[name] = flag === 1 ? [...current, ...items] : items;
          break;
        }
        default:
          throw new Error(
            `raP: unknown entry type ${type} at ${this.offset - 1}`,
          );
      }
    }

    const nextPath = new Set(path).add(offset);

    for (const [name, bodyOffset] of children) {
      result[name] = this.readClassBody(bodyOffset, depth + 1, nextPath);
    }

    return result;
  }

  private array(depth: number): ConfigValue[] {
    if (depth > MAX_CONFIG_DEPTH) throw new Error('raP: nesting is too deep');

    const count = this.compressedInt();
    const items: ConfigValue[] = [];

    for (let i = 0; i < count; i++) {
      const subtype = this.byte();
      items.push(subtype === 3 ? this.array(depth + 1) : this.scalar(subtype));
    }

    return items;
  }

  private scalar(subtype: number): string | number {
    switch (subtype) {
      case 0:
      case 4:
        return this.string();
      case 1:
        return float32ToNumber(this.read(4, (o) => this.buffer.readFloatLE(o)));
      case 2:
        return this.read(4, (o) => this.buffer.readInt32LE(o));
      case 6:
        return Number(this.read(8, (o) => this.buffer.readBigInt64LE(o)));
      default:
        throw new Error(
          `raP: unknown value type ${subtype} at ${this.offset - 1}`,
        );
    }
  }

  private seek(offset: number) {
    if (offset < 16 || offset >= this.buffer.length) {
      throw new Error(`raP: invalid offset ${offset}`);
    }
    this.offset = offset;
  }

  private read<T>(size: number, fn: (offset: number) => T): T {
    if (this.offset + size > this.buffer.length) {
      throw new Error('raP: unexpected end of file');
    }
    const value = fn(this.offset);
    this.offset += size;
    return value;
  }

  private byte() {
    return this.read(1, (o) => this.buffer[o]);
  }

  private uint32() {
    return this.read(4, (o) => this.buffer.readUInt32LE(o));
  }

  private string() {
    const end = this.buffer.indexOf(0, this.offset);
    if (end === -1) throw new Error('raP: unterminated string');

    const value = this.buffer.toString('utf8', this.offset, end);
    this.offset = end + 1;
    return value;
  }

  private compressedInt() {
    let value = 0;

    for (let shift = 0; shift < 35; shift += 7) {
      const byte = this.byte();
      value += (byte & 0x7f) * 2 ** shift;
      if (!(byte & 0x80)) return value;
    }

    throw new Error('raP: invalid compressed integer');
  }
}
