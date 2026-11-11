import { BadRequestException } from '@nestjs/common';

import { readString } from 'src/shared/utils/validation';

import {
  SQUAD_DESCRIPTION_MAX,
  SQUAD_NAME_MAX,
  SQUAD_TAG_MAX,
} from './squad.schema';

type CreateSquadDto = {
  name: string;
  tag: string;
  description: string;
};

type UpdateSquadDto = Partial<CreateSquadDto>;

const readDescription = (value: unknown) => {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== 'string') {
    throw new BadRequestException('description must be a string');
  }

  const trimmed = value.trim();

  if (trimmed.length > SQUAD_DESCRIPTION_MAX) {
    throw new BadRequestException(
      `description must be at most ${SQUAD_DESCRIPTION_MAX} characters`,
    );
  }

  return trimmed;
};

const parseCreateSquadBody = (
  body: Record<string, unknown> = {},
): CreateSquadDto => ({
  name: readString(body.name, 'name', { max: SQUAD_NAME_MAX, required: true }),
  tag: readString(body.tag, 'tag', { max: SQUAD_TAG_MAX, required: true }),
  description: readDescription(body.description) ?? '',
});

/** Only the passed fields are changed; name and tag cannot be emptied. */
const parseUpdateSquadBody = (
  body: Record<string, unknown> = {},
): UpdateSquadDto => {
  const dto: UpdateSquadDto = {};

  if (body.name !== undefined) {
    dto.name = readString(body.name, 'name', {
      max: SQUAD_NAME_MAX,
      required: true,
    });
  }

  if (body.tag !== undefined) {
    dto.tag = readString(body.tag, 'tag', {
      max: SQUAD_TAG_MAX,
      required: true,
    });
  }

  if (body.description !== undefined) {
    dto.description = readDescription(body.description) ?? '';
  }

  return dto;
};

export { parseCreateSquadBody, parseUpdateSquadBody };

export type { CreateSquadDto, UpdateSquadDto };
