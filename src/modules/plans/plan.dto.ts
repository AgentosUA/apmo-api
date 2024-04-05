import { Plan } from './plan.schema';

export class CreatePlanDto extends Plan {}

export class UpdatePlanDto extends Plan {
  readonly id: string;
}

export class GetPlanByIdDto {
  readonly id: string;
}

export class DeletePlanByIdDto {
  readonly id: string;
}
