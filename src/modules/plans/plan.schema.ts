import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SetCommonIdType } from 'src/shared/utils/schema';
import { callsignsObject } from './lib';

export type PlanDocument = HydratedDocument<Plan>;

@Schema()
class Intel {
  @Prop()
  overviewText: string;

  @Prop()
  year: number;

  @Prop()
  month: number;

  @Prop()
  day: number;

  @Prop()
  hour: number;

  @Prop()
  minute: number;
}

@Schema()
class Diary {
  @Prop()
  title: string;

  @Prop()
  name: string;

  @Prop()
  value: string;
}

@Schema({ _id: false })
class Briefing {
  @Prop()
  intel: Intel;

  @Prop()
  diary: Diary[];
}

@Schema()
class Group {
  @Prop()
  side: string;

  @Prop()
  units: Unit[];
}

@Schema()
class Vehicle {
  @Prop()
  side: string;

  @Prop()
  type: string;
  description: string;
  position: Position;
}

@Schema()
class Coordinates {
  @Prop()
  x: number;

  @Prop()
  y: number;

  @Prop()
  z: number;
}

@Schema()
class Position {
  @Prop()
  coordinates: Coordinates;
  @Prop()
  angle: number;
}

@Schema()
class Unit {
  @Prop()
  side: string;

  @Prop()
  rank: string;

  @Prop()
  type: string;

  @Prop()
  description: string;

  @Prop()
  isPlayable: true;

  @Prop({ type: Object, default: null })
  inventory: null;

  @Prop()
  position: Position;
}

@Schema()
class MissionMarker {
  @Prop()
  type: string;

  @Prop()
  width: number;

  @Prop()
  height: number;

  @Prop()
  position: Position;
}

@Schema()
class Mission {
  @Prop()
  fileName: string;

  @Prop()
  missionName: string;

  @Prop()
  island: string;

  @Prop()
  author: string;

  @Prop()
  dlcs: string[];

  @Prop()
  briefing: Briefing;

  @Prop()
  groups: Group[];

  @Prop()
  vehicles: Vehicle[];

  @Prop()
  markers: MissionMarker[];

  @Prop({ type: Object, default: callsignsObject })
  slots: {
    'Alpha 1-1': string;
    'Alpha 1-2': string;
    'Alpha 1-3': string;
    'Alpha 1-4': string;
    'Alpha 1-5': string;
    'Alpha 1-6': string;
    'Alpha 2-1': string;
    'Alpha 2-2': string;
    'Alpha 2-3': string;
    'Alpha 2-4': string;
    'Alpha 2-5': string;
    'Alpha 2-6': string;
    'Alpha 3-1': string;
    'Alpha 3-2': string;
    'Alpha 3-3': string;
    'Alpha 3-4': string;
    'Alpha 3-5': string;
    'Alpha 3-6': string;
    'Alpha 4-1': string;
    'Alpha 4-2': string;
    'Alpha 4-3': string;
    'Alpha 4-4': string;
    'Alpha 4-5': string;
    'Alpha 4-6': string;
    'Alpha 5-1': string;
    'Alpha 5-2': string;
    'Alpha 5-3': string;
    'Alpha 5-4': string;
    'Alpha 5-5': string;
    'Alpha 5-6': string;
  };
}

const ACCESS_LEVELS = ['public', 'restricted'] as const;

type AccessLevel = (typeof ACCESS_LEVELS)[number];

/**
 * Who can read / edit a plan of an authorized user.
 * `public` = anyone with the link; `restricted` = the owner plus the listed
 * users and members of the listed squads.
 */
@Schema({ _id: false })
class AccessRule {
  @Prop({ type: String, enum: ACCESS_LEVELS, default: 'restricted' })
  level: AccessLevel;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Squad' }], default: [] })
  squads: Types.ObjectId[];
}

const AccessRuleSchema = SchemaFactory.createForClass(AccessRule);

@Schema({ _id: false })
class PlanAccess {
  @Prop({ type: AccessRuleSchema })
  read: AccessRule;

  /** Edit implies read. */
  @Prop({ type: AccessRuleSchema })
  edit: AccessRule;
}

const PlanAccessSchema = SchemaFactory.createForClass(PlanAccess);

@Schema({ timestamps: true })
class Plan {
  /** Plan name, prefilled with the mission name on save. */
  @Prop({ default: 'Untitled', trim: true, maxlength: 120 })
  title: string;

  /** World (island) class name, so plans without a mission can open their map. */
  @Prop({ type: String, default: null })
  world: string | null;

  /**
   * Author. `null` = anonymous plan (anyone with the link can edit it).
   * Missing on plans created before v2 — resolved from `User.plans` on first access.
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner?: Types.ObjectId | null;

  /** Only for plans with an owner. Missing = defaults (public read, owner-only edit). */
  @Prop({ type: PlanAccessSchema })
  access?: PlanAccess;

  @Prop()
  planMarkers: string;

  @Prop({ default: null })
  mission: Mission;

  /** Set by `timestamps`. Missing on plans created before v2. */
  createdAt?: Date;

  updatedAt?: Date;
}

export {
  ACCESS_LEVELS,
  AccessRule,
  PlanAccess,
  Plan,
  Group,
  Unit,
  Coordinates,
  Position,
  Mission,
  MissionMarker,
  Briefing,
  Intel,
};

export type { AccessLevel };

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.plugin(SetCommonIdType);
