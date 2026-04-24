import { Injectable } from '@nestjs/common';
import {
  AccessDirection,
  AccessResult,
  CardStatus,
  MemberStatus,
  PackageType,
  Prisma
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/error-codes';
import { startOfToday } from '../../common/utils/date';
import { AccessVerifyDto } from './dto/access-verify.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(dto: AccessVerifyDto, operatorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const happenedAt = dto.happenedAt ? new Date(dto.happenedAt) : new Date();
      const member = await tx.member.findUnique({ where: { id: dto.memberId } });
      if (!member) {
        return this.writeDenied(tx, dto, happenedAt, '会员不存在', ErrorCodes.MEMBER_NOT_FOUND, operatorId);
      }
      if (member.status !== MemberStatus.ACTIVE) {
        return this.writeDenied(tx, dto, happenedAt, '会员状态不可通行', ErrorCodes.MEMBER_NOT_ACTIVE, operatorId);
      }

      const presence = await tx.memberPresence.findUnique({ where: { memberId: dto.memberId } });

      if (dto.direction === AccessDirection.OUT) {
        if (!presence?.inGym) {
          return this.writeDenied(
            tx,
            dto,
            happenedAt,
            '会员不在馆内，异常离场',
            ErrorCodes.PRESENCE_NOT_IN_GYM,
            operatorId
          );
        }

        const card = await this.findCurrentAccessCard(tx, dto.memberId, happenedAt, true);
        await tx.memberPresence.update({
          where: { memberId: dto.memberId },
          data: { inGym: false, lastOutAt: happenedAt }
        });
        const log = await tx.accessLog.create({
          data: {
            memberId: dto.memberId,
            memberCardId: card?.id,
            direction: AccessDirection.OUT,
            result: AccessResult.ALLOWED,
            reason: '正常离场',
            happenedAt,
            operatorId
          }
        });
        return { allowed: true, reason: '正常离场', log };
      }

      const alreadyIn = Boolean(presence?.inGym);
      const card = await this.findCurrentAccessCard(tx, dto.memberId, happenedAt, alreadyIn);
      if (!card) {
        return this.writeDenied(tx, dto, happenedAt, '无可用门禁会员卡', ErrorCodes.CARD_NOT_ACTIVE, operatorId);
      }

      if (!alreadyIn && card.type === PackageType.VISIT_CARD) {
        const deducted = await tx.memberCard.updateMany({
          where: {
            id: card.id,
            remainingVisits: { gt: 0 }
          },
          data: { remainingVisits: { decrement: 1 } }
        });
        if (!deducted.count) {
          return this.writeDenied(tx, dto, happenedAt, '次卡剩余次数不足', ErrorCodes.CARD_VISITS_NOT_ENOUGH, operatorId);
        }
      }

      if (presence && !alreadyIn) {
        await tx.memberPresence.update({
          where: { memberId: dto.memberId },
          data: { inGym: true, lastInAt: happenedAt }
        });
      } else if (!presence) {
        await tx.memberPresence.create({
          data: { memberId: dto.memberId, inGym: true, lastInAt: happenedAt }
        });
      }

      const reason = alreadyIn ? '重复入场，人数与次数不重复计算' : '正常入场';
      const log = await tx.accessLog.create({
        data: {
          memberId: dto.memberId,
          memberCardId: card.id,
          direction: AccessDirection.IN,
          result: AccessResult.ALLOWED,
          reason,
          happenedAt,
          operatorId
        }
      });
      return { allowed: true, reason, log };
    });
  }

  async logs(query: QueryAccessLogsDto) {
    const where: Prisma.AccessLogWhereInput = {
      memberId: query.memberId,
      direction: query.direction,
      result: query.result
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { happenedAt: 'desc' },
        include: { member: true, memberCard: true, operator: true }
      }),
      this.prisma.accessLog.count({ where })
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async todayCounters() {
    const today = startOfToday();
    const [current, inTotal, outTotal] = await this.prisma.$transaction([
      this.prisma.memberPresence.count({ where: { inGym: true } }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.IN, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.OUT, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      })
    ]);
    return { current, todayIn: inTotal, todayOut: outTotal };
  }

  private async findCurrentAccessCard(
    tx: Prisma.TransactionClient,
    memberId: string,
    at: Date,
    allowZeroVisit: boolean
  ) {
    return tx.memberCard.findFirst({
      where: {
        memberId,
        status: CardStatus.ACTIVE,
        type: { in: [PackageType.TIME_CARD, PackageType.VISIT_CARD] },
        startDate: { lte: at },
        OR: [{ endDate: null }, { endDate: { gte: at } }],
        AND: [
          {
            OR: [
              { type: PackageType.TIME_CARD },
              {
                type: PackageType.VISIT_CARD,
                remainingVisits: allowZeroVisit ? { gte: 0 } : { gt: 0 }
              }
            ]
          }
        ]
      },
      orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }]
    });
  }

  private async writeDenied(
    tx: Prisma.TransactionClient,
    dto: AccessVerifyDto,
    happenedAt: Date,
    reason: string,
    code: string,
    operatorId?: string
  ) {
    const log = await tx.accessLog.create({
      data: {
        memberId: dto.memberId,
        direction: dto.direction,
        result: AccessResult.DENIED,
        reason: `${code}:${reason}`,
        happenedAt,
        operatorId
      }
    });
    return { allowed: false, reason, code, log };
  }
}
