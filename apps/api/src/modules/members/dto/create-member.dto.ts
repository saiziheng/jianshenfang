import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  name!: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
