import mongoose, { Model, PipelineStage } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from './user.schema';
import { Plan } from '../plans/plan.schema';
import { MinioService } from '../minio/minio.service';
import { APMO_BUCKET } from '../minio/minio.lib';
import type { GetProfilePlansDto, PlanSortField } from './user.dto';

const PROFILE_PROJECTION = '-password -__v -tempPassword';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Fields computed in the pipeline that the sort uses. */
const SORT_FIELDS: Record<PlanSortField, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  missionName: '_sortMissionName',
  world: '_sortWorld',
};

/** Heavy mission parts that the profile list never renders. */
const LIST_EXCLUDED_FIELDS = [
  '_id',
  '__v',
  '_sortMissionName',
  '_sortWorld',
  'mission.groups',
  'mission.vehicles',
  'mission.markers',
  'mission.briefing',
];

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    private readonly minio: MinioService,
  ) {}

  async getProfile(userId: string) {
    return this.userModel
      .findById(new mongoose.Types.ObjectId(userId))
      .populate('plans')
      .select(PROFILE_PROJECTION);
  }

  /**
   * The user's plans, filtered by mission name / world and sorted.
   * `worlds` lists every world the user has plans on (ignores the filters),
   * so the client can build the world selector.
   */
  async getPlans(userId: string, query: GetProfilePlansDto) {
    const user = await this.userModel
      .findById(new mongoose.Types.ObjectId(userId))
      .select('plans')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planIds = (user.plans ?? []).map(
      (id) => new mongoose.Types.ObjectId(String(id)),
    );

    const filter: Record<string, unknown> = {};

    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [
        { 'mission.missionName': regex },
        // Plans without an uploaded mission only have a title.
        { mission: null, title: regex },
      ];
    }

    if (query.world) {
      filter['mission.island'] = {
        $regex: `^${escapeRegex(query.world)}$`,
        $options: 'i',
      };
    }

    const direction = query.order === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [
      { $match: { _id: { $in: planIds } } },
      {
        $addFields: {
          id: { $toString: '$_id' },
          // Plans created before `timestamps` was enabled: use the ObjectId time.
          createdAt: { $ifNull: ['$createdAt', { $toDate: '$_id' }] },
        },
      },
      {
        $addFields: {
          updatedAt: { $ifNull: ['$updatedAt', '$createdAt'] },
          _sortMissionName: {
            $ifNull: ['$mission.missionName', { $ifNull: ['$title', ''] }],
          },
          _sortWorld: { $ifNull: ['$mission.island', ''] },
        },
      },
      {
        $facet: {
          items: [
            { $match: filter },
            { $sort: { [SORT_FIELDS[query.sort]]: direction, _id: direction } },
            {
              $project: Object.fromEntries(
                LIST_EXCLUDED_FIELDS.map((f) => [f, 0]),
              ),
            },
          ],
          worlds: [
            { $match: { 'mission.island': { $nin: [null, ''] } } },
            { $group: { _id: '$mission.island', count: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', count: 1 } },
            { $sort: { name: 1 } },
          ],
          totalAll: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await this.planModel
      .aggregate(pipeline)
      // Case-insensitive, "Op 2" < "Op 10".
      .collation({ locale: 'en', strength: 2, numericOrdering: true });

    const items = result?.items ?? [];

    return {
      items,
      total: items.length,
      totalAll: result?.totalAll?.[0]?.count ?? 0,
      worlds: (result?.worlds ?? []) as { name: string; count: number }[],
    };
  }

  /** Sets an external avatar URL ('' resets to the default avatar). */
  async changeAvatar(userId: string, avatar: string) {
    return this.replaceAvatar(userId, avatar || null);
  }

  /** `file` is validated by `FileValidation` (size + image signature). */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const url = await this.minio.uploadImage(APMO_BUCKET.AVATARS, file.buffer, {
      prefix: userId,
      maxSize: 512,
    });

    try {
      return await this.replaceAvatar(userId, url);
    } catch (error) {
      await this.minio.removeByUrl(url);
      throw error;
    }
  }

  async removeAvatar(userId: string) {
    return this.replaceAvatar(userId, null);
  }

  /** Saves the new avatar and deletes the previous one if it was uploaded to our storage. */
  private async replaceAvatar(userId: string, avatar: string | null) {
    const id = new mongoose.Types.ObjectId(userId);
    const previous = await this.userModel.findById(id).select('avatar').lean();

    if (!previous) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, { avatar }, { new: true })
      .select(PROFILE_PROJECTION);

    if (previous.avatar && previous.avatar !== avatar) {
      // Only deletes files uploaded to our MinIO, external URLs are ignored.
      await this.minio.removeByUrl(previous.avatar);
    }

    return updated;
  }
}
