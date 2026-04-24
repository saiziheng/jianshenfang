import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsOptional()
  @IsString()
  memberCardId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}
