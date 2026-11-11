import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

import { removeExtraSlashes } from './string';

/**
 * Absolute path of a file referenced from a mission (briefing image, overview
 * picture…), or `null` when it does not exist.
 *
 * Arma paths are case-insensitive while the extracted PBO lives on a
 * case-sensitive file system, so every segment is matched ignoring case.
 * Paths that try to leave the mission folder (`..`) are rejected.
 */
const resolveMissionFile = (missionPath: string, relativePath: string) => {
  const segments = removeExtraSlashes(relativePath)
    .split('/')
    .filter((segment) => segment && segment !== '.');

  if (!segments.length || segments.includes('..')) return null;

  let current = resolve(missionPath);

  try {
    for (const segment of segments) {
      const exact = join(current, segment);

      if (existsSync(exact)) {
        current = exact;
        continue;
      }

      const lower = segment.toLowerCase();
      const match = readdirSync(current).find(
        (name) => name.toLowerCase() === lower,
      );

      if (!match) return null;

      current = join(current, match);
    }

    return statSync(current).isFile() ? current : null;
  } catch {
    return null;
  }
};

export { resolveMissionFile };
