import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateTrainerDto {
  @IsString()
  name!: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone!: string;

  @IsOptional()
  @IsString()
  specialties?: string;
}
