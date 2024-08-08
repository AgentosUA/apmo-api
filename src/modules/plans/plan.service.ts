import mongoose, { Model, isValidObjectId } from 'mongoose';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Plan } from './plan.schema';

import {
  CreatePlanDto,
  UpdatePlanDto,
  GetPlanByIdDto,
  DeletePlanByIdDto,
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
      this.userModel.updateOne(
        { id: new mongoose.Types.ObjectId(dto.userId) },
        {
          $push: {
            plans: newPlan.id,
          },
        },
      );
    }

    return newPlan.save();
  }

  async updatePlanById(dto: UpdatePlanDto) {
    const { id, ...updateData } = dto;

    if (!isValidObjectId(dto.id)) {
      throw new BadRequestException('id is not valid');
    }

    const plan = await this.planModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      updateData,
      {
        new: true,
      },
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

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

  async deletePlanByIdDto(dto: DeletePlanByIdDto) {
    const plan = await this.planModel.findByIdAndDelete(
      new mongoose.Types.ObjectId(dto.id),
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
  }
}
