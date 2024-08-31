import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
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

@Schema()
class Plan {
  @Prop({ default: 'Untitled' })
  title: string;

  @Prop()
  planMarkers: string;

  @Prop({ default: null })
  mission: Mission;
}

export {
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

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.plugin(SetCommonIdType);
