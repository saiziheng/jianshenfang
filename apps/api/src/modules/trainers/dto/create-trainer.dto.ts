import { IsOptional, IsString, Length } from 'class-validator';

export class CreateTrainerDto {
  @IsString()
  name!: string;

  @IsString()
  @Length(6, 32)
  phone!: string;

  @IsOptional()
  @IsString()
  specialties?: string;
}
