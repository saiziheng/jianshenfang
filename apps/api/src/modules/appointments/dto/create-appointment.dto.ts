import { IsDateString, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  memberId!: string;

  @IsString()
  trainerId!: string;

  @IsString()
  memberCardId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}
