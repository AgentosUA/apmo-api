import { BadRequestException } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

type StringOptions = {
  max?: number;
  min?: number;
  /** Throws when the value is missing / empty. */
  required?: boolean;
};

/** Trimmed string or `undefined` for an empty / missing value. Throws 400 on a wrong type or length. */
const readString = (
  value: unknown,
  name: string,
  { max = 100, min = 0, required = false }: StringOptions = {},
): string | undefined => {
  if (value === undefined || value === null) {
    if (required) throw new BadRequestException(`${name} is required`);

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    if (required) throw new BadRequestException(`${name} is required`);

    return undefined;
  }

  if (trimmed.length > max) {
    throw new BadRequestException(`${name} must be at most ${max} characters`);
  }

  if (trimmed.length < min) {
    throw new BadRequestException(`${name} must be at least ${min} characters`);
  }

  return trimmed;
};

const readEnum = <T extends string>(
  value: unknown,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  const parsed = readString(value, name);

  if (parsed === undefined) return fallback;

  if (!allowed.includes(parsed as T)) {
    throw new BadRequestException(
      `${name} must be one of: ${allowed.join(', ')}`,
    );
  }

  return parsed as T;
};

/** Unique valid ObjectIds (as strings). Throws 400 on a wrong type or an invalid id. */
const readObjectIds = (value: unknown, name: string, max = 100) => {
  if (value === undefined || value === null) return [];

  if (!Array.isArray(value)) {
    throw new BadRequestException(`${name} must be an array`);
  }

  if (value.length > max) {
    throw new BadRequestException(`${name} must contain at most ${max} items`);
  }

  const ids = value.map((item) => String(item));

  if (ids.some((id) => !isValidObjectId(id))) {
    throw new BadRequestException(`${name} contains an invalid id`);
  }

  return [...new Set(ids)];
};

const assertObjectId = (id: unknown, name = 'id') => {
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw new BadRequestException(`${name} is not valid`);
  }

  return new Types.ObjectId(id);
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export { readString, readEnum, readObjectIds, assertObjectId, escapeRegex };
