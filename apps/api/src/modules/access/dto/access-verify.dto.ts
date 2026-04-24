import { AccessDirection } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class AccessVerifyDto {
  @IsString()
  memberId!: string;

  @IsEnum(AccessDirection)
  direction!: AccessDirection;

  @IsOptional()
  @IsDateString()
  happenedAt?: string;
}
