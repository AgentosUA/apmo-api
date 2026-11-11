import { BadRequestException } from '@nestjs/common';

const PLAN_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'missionName',
  'world',
] as const;

const SORT_ORDERS = ['asc', 'desc'] as const;

type PlanSortField = (typeof PLAN_SORT_FIELDS)[number];
type SortOrder = (typeof SORT_ORDERS)[number];

/** `GET /profile/plans` query. */
class GetProfilePlansDto {
  /** Case-insensitive substring of the mission name (or the plan title). */
  readonly search?: string;

  /** Exact world (island) class name, e.g. "Altis". */
  readonly world?: string;

  readonly sort: PlanSortField;

  readonly order: SortOrder;
}

const MAX_QUERY_LENGTH = 100;

const readString = (value: unknown, name: string) => {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== 'string') {
    throw new BadRequestException(`${name} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new BadRequestException(
      `${name} must be at most ${MAX_QUERY_LENGTH} characters`,
    );
  }

  return trimmed || undefined;
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

const parseGetProfilePlansQuery = (
  query: Record<string, unknown>,
): GetProfilePlansDto => ({
  search: readString(query.search, 'search'),
  world: readString(query.world, 'world'),
  sort: readEnum(query.sort, 'sort', PLAN_SORT_FIELDS, 'createdAt'),
  order: readEnum(query.order, 'order', SORT_ORDERS, 'desc'),
});

export {
  GetProfilePlansDto,
  parseGetProfilePlansQuery,
  PLAN_SORT_FIELDS,
  SORT_ORDERS,
};

export type { PlanSortField, SortOrder };
