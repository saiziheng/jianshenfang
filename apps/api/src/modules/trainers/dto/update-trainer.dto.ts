import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTrainerDto } from './create-trainer.dto';

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
