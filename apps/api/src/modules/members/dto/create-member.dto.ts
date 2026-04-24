import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  name!: string;

  @IsString()
  @Length(6, 32)
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
