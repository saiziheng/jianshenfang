import { Injectable } from '@nestjs/common';
import { PackageType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePackageDto) {
    this.validateByType(dto);
    return this.prisma.packagePlan.create({ data: dto });
  }

  list(type?: PackageType) {
    return this.prisma.packagePlan.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, dto: UpdatePackageDto) {
    const current = await this.ensureExists(id);
    const next = { ...current, ...dto };
    this.validateByType(next);
    return this.prisma.packagePlan.update({ where: { id }, data: dto });
  }

  async ensureActive(id: string) {
    const plan = await this.prisma.packagePlan.findUnique({ where: { id } });
    if (!plan) throw new BusinessException(ErrorCodes.PACKAGE_NOT_FOUND, '套餐不存在', 404);
    if (!plan.active) throw new BusinessException(ErrorCodes.PACKAGE_INACTIVE, '套餐已停用');
    return plan;
  }

  private async ensureExists(id: string) {
    const plan = await this.prisma.packagePlan.findUnique({ where: { id } });
    if (!plan) throw new BusinessException(ErrorCodes.PACKAGE_NOT_FOUND, '套餐不存在', 404);
    return plan;
  }

  private validateByType(dto: {
    type: PackageType;
    durationDays?: number | null;
    totalVisits?: number | null;
    totalLessons?: number | null;
  }) {
    if (dto.type === PackageType.TIME_CARD && !dto.durationDays) {
      throw new BusinessException(ErrorCodes.PACKAGE_RULE_INVALID, '时间卡必须配置有效天数');
    }
    if (dto.type === PackageType.VISIT_CARD && !dto.totalVisits) {
      throw new BusinessException(ErrorCodes.PACKAGE_RULE_INVALID, '次卡必须配置总次数');
    }
    if (dto.type === PackageType.PT_CARD && !dto.totalLessons) {
      throw new BusinessException(ErrorCodes.PACKAGE_RULE_INVALID, '私教卡必须配置课时数');
    }
  }
}
