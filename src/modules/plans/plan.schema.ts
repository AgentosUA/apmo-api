import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema()
export class Plan {
  @Prop({ default: 'Untitled' })
  title: string;

  @Prop()
  planMarkers: string;

  @Prop()
  mission: {
    fileName: string;
    missionName: string;
    author: string;
    dlcs: string[];
    briefing: {
      diary: string;
      intel: {
        overviewText: string;
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
      };
    };

    groups: {
      id: 11081;
      side: string;
      units: {
        id: number;
        side: string;
        rank: string;
        type: string;
        description: string;
        isPlayable: true;
        inventory: null;
        position: {
          coordinates: {
            x: number;
            y: number;
            z: number;
          };
          angles: [number, number, number];
        };
      }[];
    }[];
  };
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
