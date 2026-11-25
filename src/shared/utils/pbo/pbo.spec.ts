import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import {
  ConfigClass,
  ConfigValue,
  PboArchive,
  derap,
  isRapified,
  parseConfig,
  parseConfigFile,
} from '.';
import { float32ToNumber } from './config.types';

const fixture = (name: string) =>
  readFileSync(join(__dirname, '__fixtures__', name));

const PLAYGROUND_SQM = resolve(
  __dirname,
  '../../../../public/missions/playground/mission.sqm',
);

describe('parseConfig (text)', () => {
  it('parses classes, values, arrays and comments', () => {
    const config = parseConfig(`
      ////////////////
      //DeRap: mission.sqm
      #define _ARMA_
      version = 54;
      /* block
         comment */
      class EditorData
      {
        angleGridStep = 0.2617994;
        atlOffset = 1.9073486e-006;
        toggles = 0x10;
        class Camera { pos[] = {5504.296, -324.5, 15011.485}; };
      };
      addons[] = {"A3_Characters_F", "ace_explosives"};
      nested[] = {{1, 2}, {"a", {}}};
      class Extern;
      class Child: Base { side = West; };
    `);

    expect(config).toEqual({
      version: 54,
      EditorData: {
        angleGridStep: 0.2617994,
        atlOffset: 1.9073486e-6,
        toggles: 16,
        Camera: { pos: [5504.296, -324.5, 15011.485] },
      },
      addons: ['A3_Characters_F', 'ace_explosives'],
      nested: [
        [1, 2],
        ['a', []],
      ],
      Extern: {},
      Child: { side: 'West' },
    });
  });

  it('unescapes "" and joins multi-line strings', () => {
    const config = parseConfig(
      'init = "hint ""hi"";";\ntext = "line 1" \\n "line 2";\nempty = "";',
    );

    expect(config).toEqual({
      init: 'hint "hi";',
      text: 'line 1\nline 2',
      empty: '',
    });
  });

  it('supports +=, delete and keeps # inside strings', () => {
    const config = parseConfig(`
      list[] = {1};
      list[] += {2, 3};
      class Gone {};
      delete Gone;
      property = "#filter";
    `);

    expect(config).toEqual({ list: [1, 2, 3], property: '#filter' });
  });

  it('throws on broken input', () => {
    expect(() => parseConfig('class A { a = 1;')).toThrow(/line 1/);
    expect(() => parseConfig('a = "unterminated;')).toThrow();
    expect(() => parseConfig('}')).toThrow();
  });
});

describe('derap (binarized)', () => {
  it('round-trips the playground mission through raP', () => {
    const text = parseConfig(readFileSync(PLAYGROUND_SQM));
    const binary = rapify(text);

    expect(isRapified(binary)).toBe(true);
    expect(derap(binary)).toEqual(text);
  });

  it('parses a mission binarized by Arma 3', () => {
    const data = parseConfigFile(fixture('binarized-mission.sqm'));
    const mission = data.Mission as ConfigClass;

    expect(data.sourceName).toBe('VTG_Kunduz_Chains_143_04');
    expect((data.ScenarioData as ConfigClass).author).toBe('[MILF] Revizor');
    expect((mission.Intel as ConfigClass).year).toBe(2012);
    expect((mission.Intel as ConfigClass).overviewText).toContain('Талібан');
    expect((data.EditorData as ConfigClass).angleGridStep).toBe(0.2617994);
    expect(Array.isArray(data.addons)).toBe(true);
    expect((mission.Entities as ConfigClass).items).toBeGreaterThan(0);
  });

  it('rejects malformed files', () => {
    expect(() => derap(Buffer.from('not rap'))).toThrow();

    // root body: no parent, 1 entry, class "A" whose body is the root itself
    const loop = Buffer.concat([
      header(),
      Buffer.from([0, 1, 0]),
      Buffer.from('A\0'),
      u32(16),
    ]);
    expect(() => derap(loop)).toThrow(/circular/);
  });
});

describe('float32ToNumber', () => {
  it('returns the shortest text form, ties rounded half to even (like derap)', () => {
    const cases: [number, number][] = [
      [0.2617994, 0.2617994],
      [-0.61683625, -0.61683625],
      [1.9073486e-6, 1.9073486e-6],
      [5504.03125, 5504.0312],
      [-5504.03125, -5504.0312],
      [17476.8125, 17476.812],
      [0.1, 0.1],
      [3, 3],
    ];

    for (const [input, expected] of cases) {
      expect(float32ToNumber(Math.fround(input))).toBe(expected);
    }
  });
});

describe('PboArchive', () => {
  const files = {
    'mission.sqm': Buffer.from('version = 54;'),
    'briefing.sqf': Buffer.from(
      'player createDiaryRecord ["Diary", ["A", "B"]];',
    ),
    'Images\\Overview.paa': Buffer.from([1, 2, 3, 4]),
  };

  it('reads files, header extensions and compressed entries', () => {
    const pbo = PboArchive.fromBuffer(
      buildPbo(files, { prefix: 'my_mission', product: 'Arma 3' }, [
        'briefing.sqf',
      ]),
    );

    expect(pbo.extensions).toEqual({ prefix: 'my_mission', product: 'Arma 3' });
    expect(pbo.entries.map((e) => e.path)).toEqual([
      'mission.sqm',
      'briefing.sqf',
      'Images/Overview.paa',
    ]);
    expect(pbo.read('briefing.sqf')).toEqual(files['briefing.sqf']);
    expect(pbo.read('images/overview.PAA')).toEqual(
      files['Images\\Overview.paa'],
    );
    expect(pbo.read('missing.txt')).toBeNull();
  });

  it('reads PBOs without a product entry', () => {
    const pbo = PboArchive.fromBuffer(buildPbo(files, null));

    expect(pbo.read('mission.sqm')?.toString()).toBe('version = 54;');
  });

  it('extracts to disk and never writes outside the target folder', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pbo-'));
    const target = join(dir, 'out');

    try {
      const pbo = PboArchive.fromBuffer(
        buildPbo(
          {
            ...files,
            '..\\evil.txt': Buffer.from('x'),
            '/abs.txt': Buffer.from('x'),
          },
          null,
        ),
      );
      await pbo.extractTo(target);

      expect(readFileSync(join(target, 'mission.sqm'), 'utf8')).toBe(
        'version = 54;',
      );
      expect(existsSync(join(target, 'Images', 'Overview.paa'))).toBe(true);
      expect(existsSync(join(dir, 'evil.txt'))).toBe(false);
      expect(existsSync(join(target, 'abs.txt'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects truncated archives', () => {
    const pbo = buildPbo(files, null);

    expect(() => PboArchive.fromBuffer(pbo.subarray(0, 40))).toThrow();
    expect(() => PboArchive.fromBuffer(Buffer.alloc(0))).toThrow();
  });
});

// ---------- helpers: minimal writers for the formats under test ----------

const u32 = (value: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
};

const asciiz = (value: string) => Buffer.from(`${value}\0`, 'utf8');

const header = () =>
  Buffer.concat([Buffer.from('\0raP'), u32(0), u32(8), u32(0)]);

const compressedInt = (value: number) => {
  const bytes: number[] = [];
  do {
    let byte = value & 0x7f;
    value = Math.floor(value / 128);
    if (value) byte |= 0x80;
    bytes.push(byte);
  } while (value);
  return Buffer.from(bytes);
};

/** Test-only rapifier (the inverse of `derap`). */
const rapify = (root: ConfigClass) => {
  const chunks: Buffer[] = [header()];
  let size = 16;
  const push = (chunk: Buffer) => {
    chunks.push(chunk);
    size += chunk.length;
  };

  const scalar = (value: ConfigValue): Buffer => {
    if (typeof value === 'string')
      return Buffer.concat([Buffer.from([0]), asciiz(value)]);
    const int = Number.isInteger(value) && !Object.is(value, -0);
    if (int && Math.abs(value as number) < 2 ** 31) {
      const b = Buffer.alloc(5);
      b[0] = 2;
      b.writeInt32LE(value as number, 1);
      return b;
    }
    const b = Buffer.alloc(5);
    b[0] = 1;
    b.writeFloatLE(value as number, 1);
    return b;
  };

  const array = (items: ConfigValue[]): Buffer =>
    Buffer.concat([
      compressedInt(items.length),
      ...items.map((item) =>
        Array.isArray(item)
          ? Buffer.concat([Buffer.from([3]), array(item)])
          : scalar(item),
      ),
    ]);

  const body = (cls: ConfigClass) => {
    const entries = Object.entries(cls);
    push(asciiz(''));
    push(compressedInt(entries.length));
    const pointers: [ConfigClass, number][] = [];

    for (const [name, value] of entries) {
      if (Array.isArray(value)) {
        push(Buffer.concat([Buffer.from([2]), asciiz(name), array(value)]));
      } else if (typeof value === 'object') {
        push(Buffer.concat([Buffer.from([0]), asciiz(name)]));
        pointers.push([value, size]);
        push(u32(0)); // patched below
      } else {
        const encoded = scalar(value);
        push(
          Buffer.concat([
            Buffer.from([1, encoded[0]]),
            asciiz(name),
            encoded.subarray(1),
          ]),
        );
      }
    }

    for (const [child, at] of pointers) {
      patches.push([at, size]);
      body(child);
    }
  };

  const patches: [number, number][] = [];
  body(root);

  const result = Buffer.concat(chunks);
  for (const [at, offset] of patches) result.writeUInt32LE(offset, at);
  result.writeUInt32LE(result.length, 12);
  return Buffer.concat([result, u32(0)]);
};

/** LZSS "compression" with literals only: valid input for the decompressor. */
const lzssLiterals = (data: Buffer) => {
  const out: number[] = [];
  for (let i = 0; i < data.length; i += 8) {
    out.push(0xff, ...data.subarray(i, i + 8));
  }
  return Buffer.concat([Buffer.from(out), u32(0)]);
};

const buildPbo = (
  files: Record<string, Buffer>,
  extensions: Record<string, string> | null,
  compressed: string[] = [],
) => {
  const head: Buffer[] = [];
  const data: Buffer[] = [];

  if (extensions) {
    head.push(asciiz(''), u32(0x56657273), u32(0), u32(0), u32(0), u32(0));
    for (const [key, value] of Object.entries(extensions)) {
      head.push(asciiz(key), asciiz(value));
    }
    head.push(asciiz(''));
  }

  for (const [name, content] of Object.entries(files)) {
    const packed = compressed.includes(name) ? lzssLiterals(content) : content;
    head.push(
      asciiz(name),
      u32(compressed.includes(name) ? 0x43707273 : 0),
      u32(content.length),
      u32(0),
      u32(0),
      u32(packed.length),
    );
    data.push(packed);
  }

  head.push(asciiz(''), Buffer.alloc(20));

  return Buffer.concat([...head, ...data, Buffer.alloc(21)]);
};
