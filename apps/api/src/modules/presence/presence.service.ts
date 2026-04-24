import { Injectable } from '@nestjs/common';
import { AccessDirection, AccessResult } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { startOfToday } from '../../common/utils/date';
import { ManualCorrectionDto } from './dto/manual-correction.dto';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const today = startOfToday();
    const [current, todayIn, todayOut, abnormalOut] = await this.prisma.$transaction([
      this.prisma.memberPresence.count({ where: { inGym: true } }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.IN, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.OUT, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.OUT, result: AccessResult.DENIED, happenedAt: { gte: today } }
      })
    ]);
    return { current, todayIn, todayOut, abnormalOut };
  }

  currentMembers() {
    return this.prisma.memberPresence.findMany({
      where: { inGym: true },
      include: { member: true },
      orderBy: { lastInAt: 'desc' }
    });
  }

  async correct(dto: ManualCorrectionDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: dto.memberId } });
      if (!member) throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);

      const now = new Date();
      const presence = await tx.memberPresence.upsert({
        where: { memberId: dto.memberId },
        create: {
          memberId: dto.memberId,
          inGym: dto.inGym,
          lastInAt: dto.inGym ? now : undefined,
          lastOutAt: dto.inGym ? undefined : now,
          correctedById: adminId,
          correctionReason: dto.reason
        },
        update: {
          inGym: dto.inGym,
          lastInAt: dto.inGym ? now : undefined,
          lastOutAt: dto.inGym ? undefined : now,
          correctedById: adminId,
          correctionReason: dto.reason
        }
      });

      const log = await tx.accessLog.create({
        data: {
          memberId: dto.memberId,
          direction: dto.inGym ? AccessDirection.IN : AccessDirection.OUT,
          result: AccessResult.MANUAL,
          reason: dto.reason,
          happenedAt: now,
          operatorId: adminId
        }
      });

      return { presence, log };
    });
  }
}
