import { Plan } from './plan.schema';

export class CreatePlanDto extends Plan {
  readonly userId?: string;
}

export class UpdatePlanDto extends Plan {
  readonly id: string;
}

export class GetPlanByIdDto {
  readonly id: string;
}

export class DeletePlanByIdDto {
  readonly id: string;
}

export class FindPlansDto {
  readonly map?: string;
  readonly missionName?: string;
  readonly skip?: number;
  readonly take?: number;
}
