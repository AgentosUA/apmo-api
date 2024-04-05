import { Schema } from 'mongoose';

const SetCommonIdType = (schema: Schema) => {
  schema.set('toJSON', {
    transform: (_, ret: any) => {
      ret.id = ret._id;
      delete ret._id;

      return ret;
    },
  });
};

export { SetCommonIdType };
