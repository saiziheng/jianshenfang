import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCardDto {
  @IsString()
  memberId!: string;

  @IsString()
  packageId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  remark?: string;
}
