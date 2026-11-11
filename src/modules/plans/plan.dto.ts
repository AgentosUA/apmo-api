import { BadRequestException } from '@nestjs/common';

import { readString } from 'src/shared/utils/validation';

import type { Mission } from './plan.schema';

const PLAN_TITLE_MAX = 120;

/** Fields a client may write. `owner` / `access` are never taken from the body. */
type PlanBody = {
  title?: string;
  world?: string | null;
  planMarkers?: string;
  mission?: Mission | null;
};

const readPlanMarkers = (value: unknown) => {
  if (value === undefined) return undefined;

  if (typeof value !== 'string') {
    throw new BadRequestException('planMarkers must be a JSON string');
  }

  try {
    if (!Array.isArray(JSON.parse(value))) throw new Error();
  } catch {
    throw new BadRequestException('planMarkers must be a JSON array');
  }

  return value;
};

const readMission = (value: unknown) => {
  if (value === undefined) return undefined;

  if (value === null) return null;

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('mission must be an object');
  }

  return value as Mission;
};

const parsePlanBody = (body: Record<string, unknown> = {}): PlanBody => {
  const dto: PlanBody = {};

  if (body.title !== undefined) {
    dto.title = readString(body.title, 'title', { max: PLAN_TITLE_MAX });
  }

  if (body.world !== undefined) {
    dto.world = readString(body.world, 'world', { max: 64 }) ?? null;
  }

  const planMarkers = readPlanMarkers(body.planMarkers);
  if (planMarkers !== undefined) dto.planMarkers = planMarkers;

  const mission = readMission(body.mission);
  if (mission !== undefined) dto.mission = mission;

  return dto;
};

export { parsePlanBody, PLAN_TITLE_MAX };

export type { PlanBody };
