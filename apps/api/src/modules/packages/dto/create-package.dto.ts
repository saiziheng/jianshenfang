import { PackageType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  name!: string;

  @IsEnum(PackageType)
  type!: PackageType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalVisits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalLessons?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
