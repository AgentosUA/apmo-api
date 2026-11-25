import { mkdir, writeFile } from 'fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'path';

import { lzssDecompress } from '../paa/lzss';

/**
 * Bohemia Interactive PBO archive reader (replacement for Mikero's `extractpbo`).
 *
 * Layout:
 *   header entries, each: asciiz filename + 5 × uint32
 *     (packingMethod, originalSize, reserved, timestamp, dataSize)
 *   - the first entry may be an empty-named "product" entry (packingMethod
 *     `Vers`), followed by asciiz key/value pairs ending with an empty string
 *     (`prefix`, `product`, `version`, …);
 *   - an empty-named entry with any other packing method ends the header;
 *   then the file data, in header order;
 *   then (Arma) a 0x00 byte + 20-byte SHA1 checksum.
 *
 * Entries packed with `Cprs` (or whose originalSize differs from dataSize) are
 * LZSS-compressed.
 */

const PACKING_UNCOMPRESSED = 0x00000000;
const PACKING_PRODUCT = 0x56657273; // 'Vers'
const PACKING_COMPRESSED = 0x43707273; // 'Cprs'
const PACKING_ENCRYPTED = 0x456e6372; // 'Encr'

const ENTRY_META_SIZE = 20;
/** Guards against garbage input producing a huge header loop. */
const MAX_ENTRIES = 100_000;

export type PboEntry = {
  /** Path inside the archive, `/`-separated. */
  path: string;
  packingMethod: number;
  originalSize: number;
  timestamp: number;
  dataSize: number;
  /** Absolute offset of the entry data in the archive buffer. */
  offset: number;
};

export class PboArchive {
  private readonly byPath = new Map<string, PboEntry>();

  private constructor(
    private readonly source: Buffer,
    readonly entries: PboEntry[],
    readonly extensions: Record<string, string>,
  ) {
    for (const entry of entries) {
      this.byPath.set(entry.path.toLowerCase(), entry);
    }
  }

  static fromBuffer(source: Buffer): PboArchive {
    const reader = new HeaderReader(source);
    const extensions: Record<string, string> = {};
    const headers: Omit<PboEntry, 'offset'>[] = [];

    for (let index = 0; ; index++) {
      if (index > MAX_ENTRIES) throw new Error('PBO: too many header entries');

      const name = reader.string();
      const [packingMethod, originalSize, , timestamp, dataSize] =
        reader.meta();

      if (!name) {
        if (index === 0 && packingMethod === PACKING_PRODUCT) {
          for (;;) {
            const key = reader.string();
            if (!key) break;
            extensions[key] = reader.string();
          }
          continue;
        }

        break;
      }

      headers.push({
        path: normalizeEntryPath(name),
        packingMethod,
        originalSize,
        timestamp,
        dataSize,
      });
    }

    if (!headers.length) throw new Error('PBO: archive has no files');

    let offset = reader.offset;
    const entries = headers.map((header) => {
      const entry = { ...header, offset };
      offset += header.dataSize;

      if (offset > source.length) {
        throw new Error(`PBO: data of "${header.path}" is truncated`);
      }

      return entry;
    });

    return new PboArchive(source, entries, extensions);
  }

  /** Case-insensitive lookup, `/` or `\` separators. */
  getEntry(path: string) {
    return this.byPath.get(normalizeEntryPath(path).toLowerCase()) ?? null;
  }

  has(path: string) {
    return this.getEntry(path) !== null;
  }

  /** Unpacked file content, or `null` when the file is not in the archive. */
  read(path: string) {
    const entry = this.getEntry(path);

    return entry ? this.readEntry(entry) : null;
  }

  readEntry(entry: PboEntry): Buffer {
    const data = this.source.subarray(
      entry.offset,
      entry.offset + entry.dataSize,
    );

    if (entry.packingMethod === PACKING_ENCRYPTED) {
      throw new Error(`PBO: "${entry.path}" is encrypted`);
    }

    const compressed =
      entry.packingMethod === PACKING_COMPRESSED ||
      (entry.packingMethod === PACKING_UNCOMPRESSED &&
        entry.originalSize > 0 &&
        entry.originalSize !== entry.dataSize);

    return compressed ? lzssDecompress(data, entry.originalSize) : data;
  }

  /**
   * Writes every file into `targetDir` (created if needed), keeping the
   * archive's folder structure. Entries whose path would leave `targetDir`
   * (absolute paths, `..`) are skipped.
   */
  async extractTo(targetDir: string) {
    const root = resolve(targetDir);
    await mkdir(root, { recursive: true });

    for (const entry of this.entries) {
      const target = safeJoin(root, entry.path);
      if (!target) continue;

      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, this.readEntry(entry));
    }
  }
}

class HeaderReader {
  offset = 0;

  constructor(private readonly buffer: Buffer) {}

  string() {
    const end = this.buffer.indexOf(0, this.offset);
    if (end === -1) throw new Error('PBO: unterminated header string');

    const value = this.buffer.toString('utf8', this.offset, end);
    this.offset = end + 1;

    return value;
  }

  meta() {
    if (this.offset + ENTRY_META_SIZE > this.buffer.length) {
      throw new Error('PBO: truncated header');
    }

    const values = [0, 1, 2, 3, 4].map((i) =>
      this.buffer.readUInt32LE(this.offset + i * 4),
    );
    this.offset += ENTRY_META_SIZE;

    return values;
  }
}

const normalizeEntryPath = (path: string) =>
  path
    .replaceAll('\\', '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\.?\//, '');

const safeJoin = (root: string, entryPath: string) => {
  if (!entryPath || isAbsolute(entryPath) || /^[a-z]:/i.test(entryPath)) {
    return null;
  }

  const target = resolve(join(root, entryPath));
  const rel = relative(root, target);

  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;

  return target;
};
