import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SetCommonIdType } from 'src/shared/utils/schema';

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
class BriefingIntel {
  @Prop()
  intel: Intel;
}

@Schema()
class Briefing {
  @Prop()
  intel: BriefingIntel;
  @Prop()
  diary: string;
}

@Schema()
class MissionBriefing {
  @Prop()
  briefing: Briefing;
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
  briefing: MissionBriefing;

  @Prop()
  groups: Group[];

  @Prop()
  vehicles: Vehicle[];

  @Prop()
  markers: MissionMarker[];
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
  BriefingIntel,
  Intel,
};

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.plugin(SetCommonIdType);
