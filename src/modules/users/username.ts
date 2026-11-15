import { BadRequestException } from '@nestjs/common';

const USERNAME_MIN = 3;
const USERNAME_MAX = 24;

/**
 * Letters of any script, digits, space and `_ . - [ ]`. No `@`, so a
 * nickname can never look like someone's email (sign-in accepts both).
 */
const USERNAME_RE = /^[\p{L}\p{N}_.\-[\] ]+$/u;

/** NFKC, single spaces, trimmed. */
const normalizeUsername = (value: string) =>
  value.normalize('NFKC').replace(/\s+/g, ' ').trim();

/** Returns the normalized nickname or throws 400. Keep in sync with the web app. */
const readUsername = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Username is required');
  }

  const username = normalizeUsername(value);

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    throw new BadRequestException(
      `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters long`,
    );
  }

  if (!USERNAME_RE.test(username)) {
    throw new BadRequestException(
      'Username may contain only letters, digits, spaces and _ . - [ ]',
    );
  }

  return username;
};

const USERNAME_TAKEN = 'Username is already taken';

export {
  normalizeUsername,
  readUsername,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_RE,
  USERNAME_TAKEN,
};
