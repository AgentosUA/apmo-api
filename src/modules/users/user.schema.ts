import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Types } from 'mongoose';

import { SetCommonIdType } from 'src/shared/utils/schema';

/** External services a user can sign in with. */
const AUTH_PROVIDERS = ['google', 'steam', 'vtg'] as const;

type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/** A sign-in method linked to the user (Google, Steam, VTG). */
@Schema({ _id: false })
class LinkedAccount {
  @Prop({ required: true, enum: AUTH_PROVIDERS })
  provider: AuthProvider;

  /** Stable id on the provider: OIDC `sub` or SteamID64. */
  @Prop({ required: true })
  providerId: string;

  /** Display name on the provider, shown in the profile. */
  @Prop({ default: null })
  name: string | null;

  @Prop({ default: null })
  email: string | null;

  @Prop({ default: () => new Date() })
  linkedAt: Date;
}

const LinkedAccountSchema = SchemaFactory.createForClass(LinkedAccount);

@Schema()
class User {
  /**
   * Optional: Steam does not share an email. Uniqueness is enforced by a
   * partial index (see the index below and `user-indexes.migration.ts`).
   */
  @Prop({ default: undefined, trim: true })
  email?: string;

  @Prop({ required: true, unique: true })
  username: string;

  /** Bcrypt hash. Missing for users who only sign in with external services. */
  @Prop({ default: undefined })
  password?: string;

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

  @Prop({ default: [], type: [LinkedAccountSchema] })
  accounts: LinkedAccount[];
}

export { AUTH_PROVIDERS, LinkedAccount, User };
export type { AuthProvider };

export const UserSchema = SchemaFactory.createForClass(User);

/** Unique among users that have an email; users without one do not clash. */
export const USER_EMAIL_INDEX = {
  name: 'email_1',
  key: { email: 1 },
  options: {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  },
} as const;

/** One APMO user per external account. */
export const USER_ACCOUNTS_INDEX = {
  name: 'accounts_provider_providerId',
  key: { 'accounts.provider': 1, 'accounts.providerId': 1 },
  options: {
    unique: true,
    partialFilterExpression: { 'accounts.providerId': { $type: 'string' } },
  },
} as const;

UserSchema.index(USER_EMAIL_INDEX.key, {
  name: USER_EMAIL_INDEX.name,
  ...USER_EMAIL_INDEX.options,
});

UserSchema.index(USER_ACCOUNTS_INDEX.key, {
  name: USER_ACCOUNTS_INDEX.name,
  ...USER_ACCOUNTS_INDEX.options,
});

UserSchema.plugin(SetCommonIdType);
