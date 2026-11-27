/**
 * Missions opened by an external link: `https://arma-plan-maker.com?file=<url>`.
 *
 * The API downloads the .pbo itself, so only URLs from the allow-list in
 * `MISSION_URL_ALLOWLIST` are accepted (otherwise the endpoint would be an
 * open proxy / SSRF hole). Each entry is a URL prefix:
 *
 *   MISSION_URL_ALLOWLIST=https://s3.beta.vtg.in.ua/testing-missions/,https://*.vtg.in.ua/
 *
 * - protocol and port must match exactly;
 * - `*.example.com` matches any subdomain (not `example.com` itself);
 * - the path is a prefix matched on whole segments (`/missions` does not
 *   allow `/missions-other/`).
 *
 * An empty allow-list turns the feature off.
 */

const DEFAULT_MAX_SIZE_MB = 100;

type AllowedUrl = {
  protocol: string;
  hostname: string;
  wildcard: boolean;
  port: string;
  path: string;
};

const parseAllowlist = (value = ''): AllowedUrl[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const wildcard = /^[a-z]+:\/\/\*\./i.test(entry);

      try {
        const url = new URL(wildcard ? entry.replace('*.', '') : entry);

        if (url.protocol !== 'https:' && url.protocol !== 'http:') return [];

        return [
          {
            protocol: url.protocol,
            hostname: url.hostname.toLowerCase(),
            wildcard,
            port: url.port,
            path: url.pathname.endsWith('/')
              ? url.pathname
              : `${url.pathname}/`,
          },
        ];
      } catch {
        console.warn(`MISSION_URL_ALLOWLIST: invalid entry "${entry}"`);

        return [];
      }
    });

const matchesAllowed = (url: URL, allowed: AllowedUrl) => {
  const hostname = url.hostname.toLowerCase();

  if (url.protocol !== allowed.protocol || url.port !== allowed.port) {
    return false;
  }

  const hostMatches = allowed.wildcard
    ? hostname.endsWith(`.${allowed.hostname}`)
    : hostname === allowed.hostname;

  return hostMatches && url.pathname.startsWith(allowed.path);
};

type RemoteMissionUrl =
  | { ok: true; url: URL; fileName: string }
  | { ok: false; reason: 'invalid' | 'not-allowed' | 'not-pbo' };

/** Checks the link against the allow-list and takes the .pbo name from its path. */
const resolveRemoteMissionUrl = (
  value: unknown,
  allowlist: AllowedUrl[],
): RemoteMissionUrl => {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, reason: 'invalid' };
  }

  let url: URL;

  try {
    // WHATWG URL resolves `..` / `%2e%2e` segments, so the prefix check below
    // sees the real path.
    url = new URL(value.trim());
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (url.username || url.password) return { ok: false, reason: 'invalid' };

  if (!allowlist.some((allowed) => matchesAllowed(url, allowed))) {
    return { ok: false, reason: 'not-allowed' };
  }

  let fileName: string;

  try {
    fileName = decodeURIComponent(url.pathname.split('/').pop() ?? '');
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (!/\.pbo$/i.test(fileName) || fileName.includes('/')) {
    return { ok: false, reason: 'not-pbo' };
  }

  // The island is read from `name.Island.pbo`: keep one spelling of the extension.
  return { ok: true, url, fileName: fileName.replace(/\.pbo$/i, '.pbo') };
};

const getRemoteMissionConfig = () => {
  const maxSizeMb = Number(process.env.MISSION_URL_MAX_SIZE_MB);

  return {
    allowlist: parseAllowlist(process.env.MISSION_URL_ALLOWLIST),
    maxSize:
      (Number.isFinite(maxSizeMb) && maxSizeMb > 0
        ? maxSizeMb
        : DEFAULT_MAX_SIZE_MB) *
      1024 *
      1024,
    timeout: 30_000,
  };
};

export {
  parseAllowlist,
  resolveRemoteMissionUrl,
  getRemoteMissionConfig,
  type AllowedUrl,
  type RemoteMissionUrl,
};
