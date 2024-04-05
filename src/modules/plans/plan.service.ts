import mongoose, { Model } from 'mongoose';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Plan } from './plan.schema';

import {
  CreatePlanDto,
  UpdatePlanDto,
  GetPlanByIdDto,
  DeletePlanByIdDto,
} from './plan.dto';

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<Plan>) {}

  async createPlan(dto: CreatePlanDto) {
    const newPlan = new this.planModel(dto);

    return newPlan.save();
  }

  async updatePlanById(dto: UpdatePlanDto) {
    try {
      const { id, ...updateData } = dto;

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
    } catch (error) {
      return error;
    }
  }

  async getPlanById(dto: GetPlanByIdDto) {
    try {
      const plan = await this.planModel.findById(
        new mongoose.Types.ObjectId(dto.id),
      );

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      return plan;
    } catch (error) {
      return error;
    }
  }

  async deletePlanByIdDto(dto: DeletePlanByIdDto) {
    try {
      const plan = await this.planModel.findByIdAndDelete(
        new mongoose.Types.ObjectId(dto.id),
      );

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }
    } catch (error) {
      return error;
    }
  }
}
