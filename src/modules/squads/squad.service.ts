import mongoose, { Model, Types } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { assertObjectId, escapeRegex } from 'src/shared/utils/validation';

import { Squad, SQUAD_MEMBERS_MAX } from './squad.schema';
import type { CreateSquadDto, UpdateSquadDto } from './squad.dto';
import { User } from '../users/user.schema';
import { Plan } from '../plans/plan.schema';
import { MinioService } from '../minio/minio.service';
import { APMO_BUCKET } from '../minio/minio.lib';

/** Public part of a user, safe to show to anyone. */
const PUBLIC_USER_FIELDS = 'username avatar';

const SEARCH_LIMIT = 10;

@Injectable()
export class SquadService {
  constructor(
    @InjectModel(Squad.name) private squadModel: Model<Squad>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    private readonly minio: MinioService,
  ) {}

  /** Squads the user owns or is a member of. */
  async listMine(userId: string) {
    return this.populate(
      this.squadModel
        .find({ members: new Types.ObjectId(userId) })
        .sort({ name: 1 }),
    );
  }

  /** Search by name or tag (case-insensitive substring), for the access picker. */
  async search(query: string) {
    if (!query) return [];

    const regex = { $regex: escapeRegex(query), $options: 'i' };

    const squads = await this.squadModel
      .find({ $or: [{ name: regex }, { tag: regex }] })
      .select('name tag logo members')
      .limit(SEARCH_LIMIT)
      .lean();

    return squads.map(({ _id, name, tag, logo, members }) => ({
      id: String(_id),
      name,
      tag,
      logo: logo ?? null,
      membersCount: members?.length ?? 0,
    }));
  }

  async getById(id: string) {
    const squad = await this.populate(
      this.squadModel.findById(assertObjectId(id)),
    );

    if (!squad) throw new NotFoundException('Squad not found');

    return squad;
  }

  async create(userId: string, dto: CreateSquadDto) {
    const owner = new Types.ObjectId(userId);

    const squad = await this.squadModel.create({
      ...dto,
      owner,
      members: [owner],
    });

    return this.getById(squad.id);
  }

  async update(userId: string, id: string, dto: UpdateSquadDto) {
    const squad = await this.getOwned(userId, id);

    squad.set(dto);
    await squad.save();

    return this.getById(id);
  }

  async remove(userId: string, id: string) {
    const squad = await this.getOwned(userId, id);

    await this.squadModel.deleteOne({ _id: squad._id });

    // The squad loses every access it was given.
    await this.planModel.updateMany(
      {
        $or: [
          { 'access.read.squads': squad._id },
          { 'access.edit.squads': squad._id },
        ],
      },
      {
        $pull: {
          'access.read.squads': squad._id,
          'access.edit.squads': squad._id,
        },
      },
    );

    await this.minio.removeByUrl(squad.logo);
  }

  /** Owner only. `memberId` comes from the users search. */
  async addMember(userId: string, id: string, memberId: string) {
    const squad = await this.getOwned(userId, id);
    const member = assertObjectId(memberId, 'userId');

    const exists = await this.userModel.exists({ _id: member });

    if (!exists) throw new NotFoundException('User not found');

    if (squad.members.some((item) => item.equals(member))) {
      throw new BadRequestException('User is already a member');
    }

    if (squad.members.length >= SQUAD_MEMBERS_MAX) {
      throw new BadRequestException(
        `A squad can have at most ${SQUAD_MEMBERS_MAX} members`,
      );
    }

    await this.squadModel.updateOne(
      { _id: squad._id },
      { $addToSet: { members: member } },
    );

    return this.getById(id);
  }

  /** The owner removes anybody but themselves; a member can leave the squad. */
  async removeMember(userId: string, id: string, memberId: string) {
    const squad = await this.squadModel.findById(assertObjectId(id));

    if (!squad) throw new NotFoundException('Squad not found');

    const member = assertObjectId(memberId, 'userId');
    const isOwner = squad.owner.equals(userId);
    const isSelf = member.equals(userId);

    if (!isOwner && !isSelf) {
      throw new ForbiddenException('Only the squad owner can remove members');
    }

    if (squad.owner.equals(member)) {
      throw new BadRequestException(
        'The owner cannot leave the squad, delete it instead',
      );
    }

    await this.squadModel.updateOne(
      { _id: squad._id },
      { $pull: { members: member } },
    );

    return this.getById(id);
  }

  /** `file` is validated by `FileValidation` (size + image signature). */
  async uploadLogo(userId: string, id: string, file: Express.Multer.File) {
    const squad = await this.getOwned(userId, id);

    const url = await this.minio.uploadImage(
      APMO_BUCKET.SQUAD_LOGOS,
      file.buffer,
      { prefix: String(squad._id), maxSize: 512 },
    );

    const previous = squad.logo;

    try {
      squad.logo = url;
      await squad.save();
    } catch (error) {
      await this.minio.removeByUrl(url);
      throw error;
    }

    if (previous && previous !== url) {
      await this.minio.removeByUrl(previous);
    }

    return this.getById(id);
  }

  async removeLogo(userId: string, id: string) {
    const squad = await this.getOwned(userId, id);
    const previous = squad.logo;

    squad.logo = null;
    await squad.save();

    await this.minio.removeByUrl(previous);

    return this.getById(id);
  }

  /** Ids of the squads the user is in (used by plan access checks). */
  async getSquadIdsOfUser(userId?: string | null) {
    if (!userId || !mongoose.isValidObjectId(userId)) return [];

    const squads = await this.squadModel
      .find({ members: new Types.ObjectId(userId) })
      .select('_id')
      .lean();

    return squads.map((squad) => String(squad._id));
  }

  private async getOwned(userId: string, id: string) {
    const squad = await this.squadModel.findById(assertObjectId(id));

    if (!squad) throw new NotFoundException('Squad not found');

    if (!squad.owner.equals(userId)) {
      throw new ForbiddenException('Only the squad owner can do this');
    }

    return squad;
  }

  private populate<T>(query: mongoose.Query<T, unknown>) {
    return query
      .populate('owner', PUBLIC_USER_FIELDS)
      .populate('members', PUBLIC_USER_FIELDS);
  }
}

export { PUBLIC_USER_FIELDS };
