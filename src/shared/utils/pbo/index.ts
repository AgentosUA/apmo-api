import { parseConfig } from './config-parser';
import { ConfigClass } from './config.types';
import { derap, isRapified } from './rap';

/** Parses a config file in either form: binarized (raP) or text. */
export const parseConfigFile = (buffer: Buffer): ConfigClass =>
  isRapified(buffer) ? derap(buffer) : parseConfig(buffer);

export { PboArchive, type PboEntry } from './pbo';
export { derap, isRapified } from './rap';
export { parseConfig } from './config-parser';
export type { ConfigClass, ConfigValue } from './config.types';
