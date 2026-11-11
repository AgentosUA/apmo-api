import { Model, Types } from 'mongoose';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Plan, PlanDocument } from './plan.schema';
import type { PlanBody } from './plan.dto';
import {
  DEFAULT_PLAN_ACCESS,
  normalizeAccess,
  type PlanAccessValue,
  type PlanPermissions,
} from './plan-access';
import { PlanAccessService } from './plan-access.service';
import { PlanRoomsService } from './plan-rooms.service';
import { User } from '../users/user.schema';
import { Squad } from '../squads/squad.schema';
import { PUBLIC_USER_FIELDS } from '../squads/squad.service';

const toObjectIds = (ids: string[]) => ids.map((id) => new Types.ObjectId(id));

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Squad.name) private squadModel: Model<Squad>,
    private readonly planAccess: PlanAccessService,
    private readonly rooms: PlanRoomsService,
  ) {}

  /**
   * Anonymous plans stay editable by anyone with the link; plans of an
   * authorized user get the default access (public read, owner-only edit).
   */
  async createPlan(dto: PlanBody, userId?: string) {
    const owner = userId ? new Types.ObjectId(userId) : null;

    const plan = new this.planModel({
      title: dto.title || dto.mission?.missionName || 'Untitled',
      world: dto.world || dto.mission?.island || null,
      planMarkers: dto.planMarkers ?? '[]',
      mission: dto.mission ?? null,
      owner,
      ...(owner ? { access: this.toStoredAccess(DEFAULT_PLAN_ACCESS) } : {}),
    });

    await plan.save();

    if (owner) {
      await this.userModel.updateOne(
        { _id: owner },
        { $addToSet: { plans: plan._id } },
      );
    }

    return this.serialize(plan, userId);
  }

  /** 403 when the user cannot read the plan. */
  async getPlan(id: string, userId?: string) {
    const plan = await this.planAccess.findPlan(id);
    const permissions = await this.planAccess.permissionsFor(plan, userId);

    if (!permissions.canRead) {
      throw new ForbiddenException('You do not have access to this plan');
    }

    // An open plan is saved with a small delay — show what people see now.
    const liveMarkers = await this.rooms.peekMarkers(id);

    if (liveMarkers) {
      plan.planMarkers = JSON.stringify(liveMarkers);
    }

    return this.serialize(plan, userId, permissions);
  }

  async updatePlan(id: string, dto: PlanBody, userId?: string) {
    const plan = await this.planAccess.findPlan(id);
    const permissions = await this.planAccess.permissionsFor(plan, userId);

    if (!permissions.canEdit) {
      throw new ForbiddenException('Not allowed to update this plan');
    }

    plan.set(dto);
    await plan.save();

    if (dto.planMarkers !== undefined) {
      await this.rooms.replaceMarkers(id, dto.planMarkers);
    }

    return this.serialize(plan, userId, permissions);
  }

  /** Owner only. */
  async updateAccess(id: string, access: PlanAccessValue, userId: string) {
    const plan = await this.planAccess.findPlan(id);
    const permissions = await this.planAccess.permissionsFor(plan, userId);

    if (!permissions.isOwner) {
      throw new ForbiddenException('Only the plan owner can change access');
    }

    // Drop ids of users / squads that do not exist.
    const [users, squads] = await Promise.all([
      this.existingIds(this.userModel, [
        ...access.read.users,
        ...access.edit.users,
      ]),
      this.existingIds(this.squadModel, [
        ...access.read.squads,
        ...access.edit.squads,
      ]),
    ]);

    const ownerId = String(plan.owner);
    const keep = (ids: string[], existing: Set<string>) =>
      ids.filter((item) => existing.has(item) && item !== ownerId);

    const value: PlanAccessValue = {
      read: {
        level: access.read.level,
        users: keep(access.read.users, users),
        squads: keep(access.read.squads, squads),
      },
      edit: {
        level: access.edit.level,
        users: keep(access.edit.users, users),
        squads: keep(access.edit.squads, squads),
      },
    };

    plan.set('access', this.toStoredAccess(value));
    await plan.save();

    this.rooms.accessChanged$.next(id);

    return this.serialize(plan, userId, permissions);
  }

  /** Owner only. */
  async deletePlan(id: string, userId?: string) {
    const plan = await this.planAccess.findPlan(id);
    const permissions = await this.planAccess.permissionsFor(plan, userId);

    if (!permissions.isOwner) {
      throw new ForbiddenException('You are not allowed to delete this plan');
    }

    await this.planModel.deleteOne({ _id: plan._id });
    await this.userModel.updateOne(
      { _id: plan.owner },
      { $pull: { plans: plan._id } },
    );

    await this.rooms.drop(id);
  }

  /**
   * Plan JSON + `permissions` of the requester + public `owner`.
   * `access` (with names) is only sent to the owner.
   */
  private async serialize(
    plan: PlanDocument,
    userId?: string,
    knownPermissions?: PlanPermissions,
  ) {
    const permissions =
      knownPermissions ?? (await this.planAccess.permissionsFor(plan, userId));

    const json = plan.toJSON() as unknown as Record<string, unknown>;

    delete json.__v;
    delete json.access;

    const owner = plan.owner
      ? await this.userModel
          .findById(plan.owner)
          .select(PUBLIC_USER_FIELDS)
          .lean()
      : null;

    return {
      ...json,
      id: String(plan._id),
      world: plan.world || plan.mission?.island || null,
      owner: owner
        ? {
            id: String(owner._id),
            username: owner.username,
            avatar: owner.avatar ?? null,
          }
        : null,
      permissions,
      access:
        permissions.isOwner && plan.owner
          ? await this.populateAccess(normalizeAccess(plan.access))
          : undefined,
    };
  }

  /** Access with names / logos so the settings dialog can show the chips. */
  private async populateAccess(access: PlanAccessValue) {
    const userIds = [...access.read.users, ...access.edit.users];
    const squadIds = [...access.read.squads, ...access.edit.squads];

    const [users, squads] = await Promise.all([
      this.userModel
        .find({ _id: { $in: toObjectIds(userIds) } })
        .select(PUBLIC_USER_FIELDS)
        .lean(),
      this.squadModel
        .find({ _id: { $in: toObjectIds(squadIds) } })
        .select('name tag logo')
        .lean(),
    ]);

    const userById = new Map(
      users.map((user) => [
        String(user._id),
        {
          id: String(user._id),
          username: user.username,
          avatar: user.avatar ?? null,
        },
      ]),
    );
    const squadById = new Map(
      squads.map((squad) => [
        String(squad._id),
        {
          id: String(squad._id),
          name: squad.name,
          tag: squad.tag,
          logo: squad.logo ?? null,
        },
      ]),
    );

    const rule = (value: PlanAccessValue['read']) => ({
      level: value.level,
      users: value.users.map((id) => userById.get(id)).filter(Boolean),
      squads: value.squads.map((id) => squadById.get(id)).filter(Boolean),
    });

    return { read: rule(access.read), edit: rule(access.edit) };
  }

  private toStoredAccess(access: PlanAccessValue) {
    const rule = (value: PlanAccessValue['read']) => ({
      level: value.level,
      users: toObjectIds(value.users),
      squads: toObjectIds(value.squads),
    });

    return { read: rule(access.read), edit: rule(access.edit) };
  }

  private async existingIds(model: Model<any>, ids: string[]) {
    if (!ids.length) return new Set<string>();

    const docs = await model
      .find({ _id: { $in: toObjectIds([...new Set(ids)]) } })
      .select('_id')
      .lean();

    return new Set(docs.map((doc: { _id: unknown }) => String(doc._id)));
  }
}
