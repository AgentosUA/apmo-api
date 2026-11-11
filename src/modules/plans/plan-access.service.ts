import { Model, Types, isValidObjectId } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Plan, PlanDocument } from './plan.schema';
import {
  needsSquads,
  resolvePermissions,
  type PlanPermissions,
} from './plan-access';
import { User } from '../users/user.schema';
import { SquadService } from '../squads/squad.service';

/** Loads plans and decides what a user may do with them. */
@Injectable()
export class PlanAccessService {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly squadService: SquadService,
  ) {}

  /** Throws 404 for a missing plan or a malformed id. */
  async findPlan(id: unknown): Promise<PlanDocument> {
    if (typeof id !== 'string' || !isValidObjectId(id)) {
      throw new NotFoundException('Plan not found');
    }

    const plan = await this.planModel.findById(new Types.ObjectId(id));

    if (!plan) throw new NotFoundException('Plan not found');

    await this.resolveLegacyOwner(plan);

    return plan;
  }

  async permissionsFor(
    plan: Pick<Plan, 'owner' | 'access'>,
    userId?: string | null,
  ): Promise<PlanPermissions> {
    const squadIds =
      userId && needsSquads(plan)
        ? await this.squadService.getSquadIdsOfUser(userId)
        : [];

    return resolvePermissions(plan, { userId, squadIds });
  }

  /**
   * Plans saved before v2 have no `owner` field: the author is the user whose
   * `plans` list contains the plan. Stored once, `null` for anonymous plans.
   */
  private async resolveLegacyOwner(plan: PlanDocument) {
    if (plan.get('owner') !== undefined) return;

    // `User.plans` is typed as string[], but stores ObjectIds.
    const author = await this.userModel
      .findOne({ plans: String(plan._id) })
      .select('_id')
      .lean<{ _id: Types.ObjectId }>();

    const owner = author?._id ? new Types.ObjectId(String(author._id)) : null;

    plan.set('owner', owner);

    // Keeps `updatedAt` as is: this is not a user change.
    await this.planModel.updateOne(
      { _id: plan._id },
      { $set: { owner } },
      { timestamps: false },
    );
  }
}
