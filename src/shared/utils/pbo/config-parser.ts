import { ConfigClass, ConfigValue, MAX_CONFIG_DEPTH } from './config.types';

/**
 * Parser for text Arma configs (mission.sqm, description.ext, …), a
 * replacement for the `parse2json` binary.
 *
 * Supports: `class A { … };`, `class A: B { … };`, `class A;`, `delete A;`,
 * `name = value;`, `name[] = { … };`, `name[] += { … };`, nested arrays,
 * strings with `""` escapes and `"a" \n "b"` multi-line joins, numbers
 * (incl. `1e-006`, hex), bare words (kept as strings), `//` and `/* *\/`
 * comments. Preprocessor lines (`#define`, `#include`, …) are ignored.
 */
export const parseConfig = (input: string | Buffer): ConfigClass => {
  const text = (
    typeof input === 'string' ? input : input.toString('utf8')
  ).replace(/^﻿/, '');

  return new ConfigParser(text).parse();
};

class ConfigParser {
  private pos = 0;
  private line = 1;

  constructor(private readonly text: string) {}

  parse() {
    const root = this.classBody(0);
    this.skipTrivia();
    if (this.pos < this.text.length) this.fail('unexpected "}"');
    return root;
  }

  private classBody(depth: number): ConfigClass {
    if (depth > MAX_CONFIG_DEPTH) this.fail('nesting is too deep');

    const result: ConfigClass = {};

    for (;;) {
      this.skipTrivia();
      const char = this.text[this.pos];

      if (char === undefined || char === '}') return result;
      if (char === ';') {
        this.pos++;
        continue;
      }

      const word = this.identifier();

      if (word === 'class') {
        const name = this.identifier();
        this.skipTrivia();

        if (this.text[this.pos] === ':') {
          this.pos++;
          this.identifier(); // parent: inheritance is not resolved
          this.skipTrivia();
        }

        if (this.text[this.pos] === '{') {
          this.pos++;
          result[name] = this.classBody(depth + 1);
          this.expect('}');
        } else if (!(name in result)) {
          result[name] = {}; // extern declaration `class A;`
        }

        this.semicolon();
        continue;
      }

      if (word === 'delete') {
        delete result[this.identifier()];
        this.semicolon();
        continue;
      }

      this.skipTrivia();
      const isArray = this.text.startsWith('[]', this.pos);
      if (isArray) {
        this.pos += 2;
        this.skipTrivia();
      }

      if (isArray && this.text.startsWith('+=', this.pos)) {
        this.pos += 2;
        const current = result[word];
        const items = this.array(depth + 1);
        result[word] = Array.isArray(current) ? [...current, ...items] : items;
      } else {
        this.expect('=');
        result[word] = isArray ? this.array(depth + 1) : this.scalar(';');
      }

      this.semicolon();
    }
  }

  private array(depth: number): ConfigValue[] {
    if (depth > MAX_CONFIG_DEPTH) this.fail('nesting is too deep');

    this.expect('{');
    const items: ConfigValue[] = [];

    for (;;) {
      this.skipTrivia();
      const char = this.text[this.pos];

      if (char === '}') {
        this.pos++;
        return items;
      }
      if (char === ',') {
        this.pos++;
        continue;
      }
      if (char === undefined) this.fail('unterminated array');

      items.push(char === '{' ? this.array(depth + 1) : this.scalar(',}'));
    }
  }

  /** A string, a number or a bare word, ending before one of `terminators`. */
  private scalar(terminators: string): string | number {
    this.skipTrivia();

    if (this.text[this.pos] === '"') return this.string();

    const start = this.pos;
    while (
      this.pos < this.text.length &&
      !terminators.includes(this.text[this.pos]) &&
      this.text[this.pos] !== '\n'
    ) {
      this.pos++;
    }

    const raw = this.text.slice(start, this.pos).trim();
    if (!raw) this.fail('missing value');

    return toNumber(raw) ?? raw;
  }

  private string() {
    let value = '';

    for (;;) {
      value += this.quoted();

      // Eden / derap write multi-line strings as `"line 1" \n "line 2"`.
      const save = { pos: this.pos, line: this.line };
      this.skipTrivia();

      if (this.text.startsWith('\\n', this.pos)) {
        this.pos += 2;
        this.skipTrivia();

        if (this.text[this.pos] === '"') {
          value += '\n';
          continue;
        }
      }

      this.pos = save.pos;
      this.line = save.line;
      return value;
    }
  }

  private quoted() {
    this.pos++; // opening quote
    let value = '';

    for (;;) {
      const end = this.text.indexOf('"', this.pos);
      if (end === -1) this.fail('unterminated string');

      const chunk = this.text.slice(this.pos, end);
      this.countLines(chunk);
      value += chunk;
      this.pos = end + 1;

      if (this.text[this.pos] !== '"') return value;

      value += '"'; // `""` escape
      this.pos++;
    }
  }

  private identifier() {
    this.skipTrivia();
    const match = /^[A-Za-z0-9_.]+/.exec(
      this.text.slice(this.pos, this.pos + 512),
    );
    if (!match) this.fail('identifier expected');

    this.pos += match[0].length;
    return match[0];
  }

  private expect(char: string) {
    this.skipTrivia();
    if (this.text[this.pos] !== char) this.fail(`"${char}" expected`);
    this.pos++;
  }

  /** `;` after an entry; tolerated when missing before `}` / end of file. */
  private semicolon() {
    this.skipTrivia();
    const char = this.text[this.pos];

    if (char === ';') this.pos++;
    else if (char !== '}' && char !== undefined) this.fail('";" expected');
  }

  private skipTrivia() {
    const { text } = this;

    while (this.pos < text.length) {
      const char = text[this.pos];

      if (char === '\n') {
        this.line++;
        this.pos++;
      } else if (char === ' ' || char === '\t' || char === '\r') {
        this.pos++;
      } else if (char === '/' && text[this.pos + 1] === '/') {
        this.skipToLineEnd();
      } else if (char === '/' && text[this.pos + 1] === '*') {
        const end = text.indexOf('*/', this.pos + 2);
        const stop = end === -1 ? text.length : end + 2;
        this.countLines(text.slice(this.pos, stop));
        this.pos = stop;
      } else if (char === '#' && this.atLineStart()) {
        this.skipToLineEnd();
      } else {
        return;
      }
    }
  }

  private skipToLineEnd() {
    const end = this.text.indexOf('\n', this.pos);
    this.pos = end === -1 ? this.text.length : end;
  }

  private atLineStart() {
    for (let i = this.pos - 1; i >= 0; i--) {
      const char = this.text[i];
      if (char === '\n') return true;
      if (char !== ' ' && char !== '\t' && char !== '\r') return false;
    }
    return true;
  }

  private countLines(chunk: string) {
    for (
      let i = chunk.indexOf('\n');
      i !== -1;
      i = chunk.indexOf('\n', i + 1)
    ) {
      this.line++;
    }
  }

  private fail(message: string): never {
    throw new Error(`Config parse error at line ${this.line}: ${message}`);
  }
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const HEX = /^[+-]?0x[0-9a-f]+$/i;

const toNumber = (raw: string) => {
  if (NUMBER.test(raw)) return Number(raw);
  if (HEX.test(raw)) {
    const negative = raw.startsWith('-');
    const value = parseInt(raw.replace(/^[+-]/, ''), 16);
    return negative ? -value : value;
  }
  return null;
};
