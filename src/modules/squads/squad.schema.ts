import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SetCommonIdType } from 'src/shared/utils/schema';

export type SquadDocument = HydratedDocument<Squad>;

const SQUAD_NAME_MAX = 64;
const SQUAD_TAG_MAX = 16;
const SQUAD_DESCRIPTION_MAX = 1000;
const SQUAD_MEMBERS_MAX = 200;

/**
 * A squad (clan / unit). Neither the name nor the tag is unique.
 * The owner is always in `members` too, so "squads of a user" is one query.
 */
@Schema({ timestamps: true })
class Squad {
  @Prop({ required: true, trim: true, maxlength: SQUAD_NAME_MAX })
  name: string;

  @Prop({ required: true, trim: true, maxlength: SQUAD_TAG_MAX })
  tag: string;

  @Prop({ default: '', maxlength: SQUAD_DESCRIPTION_MAX })
  description: string;

  /** Public URL of the logo in MinIO (or null). */
  @Prop({ type: String, default: null })
  logo: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
    index: true,
  })
  members: Types.ObjectId[];

  createdAt?: Date;

  updatedAt?: Date;
}

export {
  Squad,
  SQUAD_NAME_MAX,
  SQUAD_TAG_MAX,
  SQUAD_DESCRIPTION_MAX,
  SQUAD_MEMBERS_MAX,
};

export const SquadSchema = SchemaFactory.createForClass(Squad);

SquadSchema.plugin(SetCommonIdType);
