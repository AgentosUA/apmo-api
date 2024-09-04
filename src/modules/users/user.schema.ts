import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Types } from 'mongoose';

import { SetCommonIdType } from 'src/shared/utils/schema';

@Schema()
class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  tempPassword: string;

  @Prop({ default: null })
  avatar: string;

  @Prop()
  language: string;

  @Prop()
  squadTag: string;

  @Prop({ default: [], type: [Types.ObjectId], ref: 'Plan' })
  plans: string[];
}

export { User };

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(SetCommonIdType);
