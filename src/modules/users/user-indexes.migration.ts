import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, USER_EMAIL_INDEX } from './user.schema';

/**
 * Before v2 `email` was required and had a plain unique index, which treats
 * every missing email as `null` — so only one Steam user could exist. Replaces
 * it with the partial index from the schema. Existing users are not touched.
 *
 * Mongoose never changes an existing index on its own, hence this step.
 */
@Injectable()
export class UserIndexesMigration implements OnModuleInit {
  private readonly logger = new Logger(UserIndexesMigration.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async onModuleInit() {
    try {
      const collection = this.userModel.collection;
      const indexes = await collection.indexes().catch(() => []);
      const emailIndex = indexes.find(
        (index) => index.name === USER_EMAIL_INDEX.name,
      );

      if (emailIndex && !emailIndex.partialFilterExpression) {
        this.logger.log('Replacing the users.email index with a partial one');
        await collection.dropIndex(USER_EMAIL_INDEX.name);
      }

      // Creates the missing indexes from the schema (email, accounts).
      await this.userModel.createIndexes();
    } catch (error) {
      this.logger.error(
        'Failed to migrate users indexes',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
