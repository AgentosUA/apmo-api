import { BadRequestException } from '@nestjs/common';

import { readObjectIds } from 'src/shared/utils/validation';

import { ACCESS_LEVELS, type AccessLevel } from './plan.schema';

type AccessRuleValue = {
  level: AccessLevel;
  /** User ids. */
  users: string[];
  /** Squad ids — every member of the squad gets the access. */
  squads: string[];
};

type PlanAccessValue = {
  read: AccessRuleValue;
  edit: AccessRuleValue;
};

type PlanPermissions = {
  canRead: boolean;
  canEdit: boolean;
  /** The owner manages access, renames and deletes the plan. */
  isOwner: boolean;
};

type Viewer = {
  userId?: string | null;
  /** Squads the viewer is a member of. */
  squadIds?: string[];
};

/** Plans of authorized users: anyone with the link reads, only the owner edits. */
const DEFAULT_PLAN_ACCESS: PlanAccessValue = {
  read: { level: 'public', users: [], squads: [] },
  edit: { level: 'restricted', users: [], squads: [] },
};

const MAX_ACCESS_ENTRIES = 100;

const toIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const normalizeRule = (
  rule: Partial<AccessRuleValue> | undefined,
  fallback: AccessRuleValue,
): AccessRuleValue => ({
  level: ACCESS_LEVELS.includes(rule?.level as AccessLevel)
    ? (rule.level as AccessLevel)
    : fallback.level,
  users: toIds(rule?.users),
  squads: toIds(rule?.squads),
});

/** Access stored in the DB (ObjectIds, maybe missing) → plain value with defaults. */
const normalizeAccess = (access?: unknown): PlanAccessValue => {
  const value = (access ?? {}) as Partial<
    Record<'read' | 'edit', Partial<AccessRuleValue>>
  >;

  return {
    read: normalizeRule(value.read, DEFAULT_PLAN_ACCESS.read),
    edit: normalizeRule(value.edit, DEFAULT_PLAN_ACCESS.edit),
  };
};

const parseRule = (value: unknown, name: string): AccessRuleValue => {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException(`${name} must be an object`);
  }

  const rule = value as Record<string, unknown>;

  if (!ACCESS_LEVELS.includes(rule.level as AccessLevel)) {
    throw new BadRequestException(
      `${name}.level must be one of: ${ACCESS_LEVELS.join(', ')}`,
    );
  }

  return {
    level: rule.level as AccessLevel,
    users: readObjectIds(rule.users, `${name}.users`, MAX_ACCESS_ENTRIES),
    squads: readObjectIds(rule.squads, `${name}.squads`, MAX_ACCESS_ENTRIES),
  };
};

/**
 * `PATCH /plans/:id/access` body. Editors can always read, so public edit
 * makes read public too.
 */
const parseAccessBody = (body: unknown): PlanAccessValue => {
  const value = (body ?? {}) as Record<string, unknown>;

  const read = parseRule(value.read, 'read');
  const edit = parseRule(value.edit, 'edit');

  if (edit.level === 'public') {
    read.level = 'public';
  }

  return { read, edit };
};

const matchesRule = (
  rule: AccessRuleValue,
  { userId, squadIds = [] }: Viewer,
) => {
  if (rule.level === 'public') return true;

  if (!userId) return false;

  return (
    rule.users.includes(userId) ||
    rule.squads.some((squadId) => squadIds.includes(squadId))
  );
};

/**
 * - anonymous plan (no owner): everybody reads and edits (as before v2);
 * - the owner can do everything;
 * - others: `edit` rule → edit + read, `read` rule → read.
 */
const resolvePermissions = (
  plan: { owner?: unknown; access?: unknown },
  viewer: Viewer,
): PlanPermissions => {
  const ownerId = plan.owner ? String(plan.owner) : null;

  if (!ownerId) {
    return { canRead: true, canEdit: true, isOwner: false };
  }

  if (viewer.userId && viewer.userId === ownerId) {
    return { canRead: true, canEdit: true, isOwner: true };
  }

  const access = normalizeAccess(plan.access);
  const canEdit = matchesRule(access.edit, viewer);
  const canRead = canEdit || matchesRule(access.read, viewer);

  return { canRead, canEdit, isOwner: false };
};

/** Whether the viewer's permissions could depend on squad membership. */
const needsSquads = (plan: { owner?: unknown; access?: unknown }) => {
  if (!plan.owner) return false;

  const access = normalizeAccess(plan.access);

  return access.read.squads.length > 0 || access.edit.squads.length > 0;
};

export {
  DEFAULT_PLAN_ACCESS,
  normalizeAccess,
  parseAccessBody,
  resolvePermissions,
  needsSquads,
};

export type { AccessRuleValue, PlanAccessValue, PlanPermissions, Viewer };
