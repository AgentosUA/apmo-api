import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Types } from 'mongoose';

import { SetCommonIdType } from 'src/shared/utils/schema';
import { Plan } from '../plans/plan.schema';

@Schema()
class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  avatar: string;

  @Prop()
  language: string;

  @Prop()
  squadTag: string;

  @Prop({ default: [], type: [Types.ObjectId], ref: 'Plan' })
  plans: [];
}

export { User };

export const UserSchema = SchemaFactory.createForClass(Plan);

UserSchema.plugin(SetCommonIdType);
