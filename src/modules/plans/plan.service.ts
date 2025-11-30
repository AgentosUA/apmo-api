import mongoose, { Model, isValidObjectId } from 'mongoose';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Plan } from './plan.schema';

import {
  CreatePlanDto,
  UpdatePlanDto,
  GetPlanByIdDto,
  DeletePlanByIdDto,
  FindPlansDto,
} from './plan.dto';

import { User } from '../users/user.schema';

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createPlan(dto: CreatePlanDto) {
    const newPlan = new this.planModel(dto);

    if (dto.userId) {
      this.userModel
        .findOneAndUpdate(
          { _id: dto.userId },
          {
            $push: {
              plans: newPlan.id,
            },
          },
        )
        .exec();
    }

    return newPlan.save();
  }

  async updatePlanById(dto: UpdatePlanDto, userId?: string) {
    const { id, ...updateData } = dto;

    if (!isValidObjectId(dto.id)) {
      throw new BadRequestException('id is not valid');
    }

    const plan = await this.planModel.findById(new mongoose.Types.ObjectId(id));

    const isCreatedByAuthorizedPerson = Boolean(
      (
        await this.userModel.find({
          plans: {
            $in: [plan.id],
          },
        })
      )?.length,
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (userId) {
      const user = await this.userModel.findById(userId);

      if ((!user || !user.plans.includes(id)) && isCreatedByAuthorizedPerson) {
        throw new ForbiddenException('Not allowed to update this plan');
      }

      plan.set(updateData);
      await plan.save();

      return plan;
    }

    if (isCreatedByAuthorizedPerson) {
      throw new ForbiddenException('Not allowed to update this plan');
    }

    plan.set(updateData);
    await plan.save();

    return plan;
  }

  async getPlanById(dto: GetPlanByIdDto) {
    if (!isValidObjectId(dto.id)) {
      throw new NotFoundException('Plan not found');
    }

    const plan = await this.planModel.findById(
      new mongoose.Types.ObjectId(dto.id),
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async findPlans(dto: FindPlansDto, userId: string) {
    // Get user's plan IDs
    const user = await this.userModel.findById(userId);
    if (!user || !user.plans || user.plans.length === 0) {
      return {
        plans: [],
        total: 0,
        take: dto.take ?? undefined,
        skip: dto.skip ?? undefined,
      };
    }

    // Build query with user's plan IDs
    const dtoQuery: any = {
      _id: { $in: user.plans },
    };

    // Add optional filters
    if (dto.map) {
      dtoQuery['map'] = dto.map;
    }
    if (dto.missionName) {
      dtoQuery['mission.missionName'] = dto.missionName;
    }

    // Get total count before pagination
    const total = await this.planModel.countDocuments(dtoQuery);

    // Build query with pagination
    let query = this.planModel
      .find(dtoQuery)
      .select(
        '_id planMarkers mission.missionName mission.island mission.slots mission.author',
      );

    // Apply pagination
    if (dto.skip !== undefined) {
      query = query.skip(dto.skip);
    }
    if (dto.take !== undefined) {
      query = query.limit(dto.take);
    }

    const plans = await query.exec();

    return {
      data: plans,
      total,
      take: dto.take ?? undefined,
      skip: dto.skip ?? undefined,
    };
  }

  async deletePlanByIdDto(dto: DeletePlanByIdDto, userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user || !user.plans.includes(dto.id)) {
      throw new ForbiddenException('You are not allowed to delete this plan');
    }

    const plan = await this.planModel.findByIdAndDelete(
      new mongoose.Types.ObjectId(dto.id),
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
  }
}
