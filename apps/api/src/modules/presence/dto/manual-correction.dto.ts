import { IsBoolean, IsString } from 'class-validator';

export class ManualCorrectionDto {
  @IsString()
  memberId!: string;

  @IsBoolean()
  inGym!: boolean;

  @IsString()
  reason!: string;
}
