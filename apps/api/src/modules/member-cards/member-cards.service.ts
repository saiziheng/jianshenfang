import { Injectable } from '@nestjs/common';
import {
  CardStatus,
  MemberStatus,
  PackagePlan,
  PackageType,
  PaymentBizType,
  Prisma
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { buildCardNo } from '../../common/utils/card-number';
import { addDays, startOfToday } from '../../common/utils/date';
import { AddCardBalanceDto } from './dto/add-card-balance.dto';
import { ChangeCardDto } from './dto/change-card.dto';
import { OpenCardDto } from './dto/open-card.dto';
import { RenewCardDto } from './dto/renew-card.dto';

@Injectable()
export class MemberCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async openCard(dto: OpenCardDto) {
    return this.prisma.$transaction(async (tx) => {
      const [member, plan] = await Promise.all([
        tx.member.findUnique({ where: { id: dto.memberId } }),
        tx.packagePlan.findUnique({ where: { id: dto.packageId } })
      ]);
      this.assertMemberCanUse(member);
      this.assertPackageCanUse(plan);

      const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
      const card = await tx.memberCard.create({
        data: {
          memberId: dto.memberId,
          packageId: dto.packageId,
          cardNo: buildCardNo(),
          ...this.buildInitialCardData(plan, startDate)
        }
      });

      const payment = await tx.payment.create({
        data: {
          memberId: dto.memberId,
          memberCardId: card.id,
          packageId: dto.packageId,
          amount: dto.amount,
          method: dto.method,
          bizType: PaymentBizType.OPEN_CARD,
          remark: dto.remark
        }
      });

      return { card, payment };
    });
  }

  async renewCard(dto: RenewCardDto) {
    this.assertPaymentRemark(dto);

    return this.prisma.$transaction(async (tx) => {
      const card = await tx.memberCard.findUnique({
        where: { id: dto.memberCardId },
        include: { package: true, member: true }
      });
      if (!card) throw new BusinessException(ErrorCodes.CARD_NOT_FOUND, '会员卡不存在', 404);
      if (card.status === CardStatus.TRANSFERRED || card.status === CardStatus.FROZEN) {
        throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '该会员卡不可续卡');
      }
      this.assertMemberCanUse(card.member);

      const plan = dto.packageId
        ? await tx.packagePlan.findUnique({ where: { id: dto.packageId } })
        : card.package;
      this.assertPackageCanUse(plan);
      if (dto.packageId && card.type !== plan.type) {
        throw new BusinessException(ErrorCodes.PACKAGE_RULE_INVALID, '续卡套餐类型必须与原卡一致');
      }

      const data: Prisma.MemberCardUncheckedUpdateInput = this.buildRenewData(card, plan, dto);
      const updated = await tx.memberCard.update({
        where: { id: card.id },
        data: {
          ...data,
          packageId: plan.id,
          status: CardStatus.ACTIVE
        }
      });

      const payment = await tx.payment.create({
        data: {
          memberId: card.memberId,
          memberCardId: card.id,
          packageId: plan.id,
          amount: dto.amount,
          method: dto.method,
          bizType: PaymentBizType.RENEW_CARD,
          remark: dto.remark,
          metadata: {
            durationDays: dto.durationDays,
            addVisits: dto.addVisits,
            addLessons: dto.addLessons
          }
        }
      });

      return { card: updated, payment };
    });
  }

  async changeCard(dto: ChangeCardDto) {
    return this.prisma.$transaction(async (tx) => {
      const oldCard = await tx.memberCard.findUnique({
        where: { id: dto.memberCardId },
        include: { member: true }
      });
      if (!oldCard) throw new BusinessException(ErrorCodes.CARD_NOT_FOUND, '原会员卡不存在', 404);
      if (oldCard.status === CardStatus.TRANSFERRED) {
        throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '原会员卡已换出');
      }
      this.assertMemberCanUse(oldCard.member);

      const plan = await tx.packagePlan.findUnique({ where: { id: dto.newPackageId } });
      this.assertPackageCanUse(plan);

      const oldRemainingDays = oldCard.endDate
        ? Math.max(0, Math.ceil((oldCard.endDate.getTime() - Date.now()) / 86400000))
        : null;

      await tx.memberCard.update({
        where: { id: oldCard.id },
        data: { status: CardStatus.TRANSFERRED }
      });

      const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
      const newCardData = this.buildInitialCardData(plan, startDate);
      if (dto.carryOverVisits !== undefined) {
        newCardData.remainingVisits = (newCardData.remainingVisits ?? 0) + dto.carryOverVisits;
      }
      if (dto.carryOverLessons !== undefined) {
        newCardData.remainingLessons = (newCardData.remainingLessons ?? 0) + dto.carryOverLessons;
      }
      if (dto.carryOverDays !== undefined && dto.carryOverDays > 0) {
        newCardData.endDate = addDays(newCardData.endDate ?? startDate, dto.carryOverDays);
      }

      const newCard = await tx.memberCard.create({
        data: {
          memberId: oldCard.memberId,
          packageId: plan.id,
          cardNo: buildCardNo(),
          sourceCardId: oldCard.id,
          ...newCardData
        }
      });

      const payment = await tx.payment.create({
        data: {
          memberId: oldCard.memberId,
          memberCardId: newCard.id,
          packageId: plan.id,
          amount: dto.amount,
          method: dto.method,
          bizType: PaymentBizType.CHANGE_CARD,
          remark: dto.remark,
          metadata: {
            oldCardId: oldCard.id,
            oldRemainingVisits: oldCard.remainingVisits,
            oldRemainingLessons: oldCard.remainingLessons,
            oldRemainingDays,
            oldEndDate: oldCard.endDate?.toISOString() ?? null,
            carryOverVisits: dto.carryOverVisits ?? null,
            carryOverLessons: dto.carryOverLessons ?? null,
            carryOverDays: dto.carryOverDays ?? null
          }
        }
      });

      return { oldCardId: oldCard.id, newCard, payment };
    });
  }

  async addBalance(dto: AddCardBalanceDto) {
    this.assertPaymentRemark(dto);

    return this.prisma.$transaction(async (tx) => {
      const card = await tx.memberCard.findUnique({
        where: { id: dto.memberCardId },
        include: { member: true }
      });
      if (!card) throw new BusinessException(ErrorCodes.CARD_NOT_FOUND, '会员卡不存在', 404);
      if (card.status !== CardStatus.ACTIVE) {
        throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '会员卡不是正常状态');
      }
      this.assertMemberCanUse(card.member);

      const data: Prisma.MemberCardUpdateInput = {};
      let bizType: PaymentBizType = PaymentBizType.MANUAL;
      if (card.type === PackageType.VISIT_CARD) {
        if (!dto.addVisits) {
          throw new BusinessException(ErrorCodes.CARD_VISITS_NOT_ENOUGH, '次卡必须填写增加次数');
        }
        data.totalVisits = { increment: dto.addVisits };
        data.remainingVisits = { increment: dto.addVisits };
        bizType = PaymentBizType.ADD_VISITS;
      } else if (card.type === PackageType.PT_CARD) {
        if (!dto.addLessons) {
          throw new BusinessException(ErrorCodes.CARD_LESSONS_NOT_ENOUGH, '私教卡必须填写增加课时');
        }
        data.totalLessons = { increment: dto.addLessons };
        data.remainingLessons = { increment: dto.addLessons };
        bizType = PaymentBizType.ADD_LESSONS;
      } else {
        throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '时间卡不支持增加次数或课时');
      }

      const updated = await tx.memberCard.update({ where: { id: card.id }, data });
      const payment = await tx.payment.create({
        data: {
          memberId: card.memberId,
          memberCardId: card.id,
          amount: dto.amount,
          method: dto.method,
          bizType,
          remark: dto.remark,
          metadata: {
            addVisits: dto.addVisits,
            addLessons: dto.addLessons
          }
        }
      });
      return { card: updated, payment };
    });
  }

  async warnings() {
    const today = startOfToday();
    const daysLater = addDays(today, 7);
    return this.prisma.memberCard.findMany({
      where: {
        status: CardStatus.ACTIVE,
        OR: [
          { endDate: { lte: daysLater } },
          { remainingVisits: { lte: 3 } },
          { remainingLessons: { lte: 3 } }
        ]
      },
      include: { member: true, package: true },
      orderBy: { endDate: 'asc' }
    });
  }

  private buildInitialCardData(
    plan: PackagePlan,
    startDate: Date
  ): Omit<Prisma.MemberCardUncheckedCreateInput, 'id' | 'memberId' | 'packageId' | 'cardNo' | 'createdAt' | 'updatedAt'> {
    const endDate = plan.durationDays ? addDays(startDate, plan.durationDays) : null;
    return {
      type: plan.type,
      status: CardStatus.ACTIVE,
      startDate,
      endDate,
      totalVisits: plan.type === PackageType.VISIT_CARD ? plan.totalVisits : null,
      remainingVisits: plan.type === PackageType.VISIT_CARD ? plan.totalVisits : null,
      totalLessons: plan.type === PackageType.PT_CARD ? plan.totalLessons : null,
      remainingLessons: plan.type === PackageType.PT_CARD ? plan.totalLessons : null
    };
  }

  private buildRenewData(
    card: {
      type: PackageType;
      endDate: Date | null;
    },
    plan: PackagePlan,
    dto: RenewCardDto
  ): Prisma.MemberCardUncheckedUpdateInput {
    if (card.type === PackageType.TIME_CARD) {
      const days = dto.durationDays ?? plan.durationDays;
      if (!days) throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '续时间卡必须填写有效天数');
      const base = card.endDate && card.endDate > new Date() ? card.endDate : new Date();
      return { endDate: addDays(base, days) };
    }

    if (card.type === PackageType.VISIT_CARD) {
      const addVisits = dto.addVisits ?? plan.totalVisits;
      if (!addVisits) throw new BusinessException(ErrorCodes.CARD_VISITS_NOT_ENOUGH, '续次卡必须填写次数');
      return {
        totalVisits: { increment: addVisits },
        remainingVisits: { increment: addVisits },
        endDate: this.extendEndDate(card.endDate, plan.durationDays)
      };
    }

    const addLessons = dto.addLessons ?? plan.totalLessons;
    if (!addLessons) throw new BusinessException(ErrorCodes.CARD_LESSONS_NOT_ENOUGH, '续私教卡必须填写课时');
    return {
      totalLessons: { increment: addLessons },
      remainingLessons: { increment: addLessons },
      endDate: this.extendEndDate(card.endDate, plan.durationDays)
    };
  }

  private extendEndDate(currentEnd: Date | null, days: number | null | undefined): Date | undefined {
    if (!days) return undefined;
    const base = currentEnd && currentEnd > new Date() ? currentEnd : new Date();
    return addDays(base, days);
  }

  private assertPaymentRemark(dto: { amount: number; remark?: string }) {
    if (dto.amount === 0 && (!dto.remark || dto.remark.trim().length < 4)) {
      throw new BusinessException(ErrorCodes.PAYMENT_REMARK_REQUIRED, '零元操作必须填写不少于 4 字的备注说明');
    }
  }

  private assertMemberCanUse(member: { status: MemberStatus } | null) {
    if (!member) throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);
    if (member.status !== MemberStatus.ACTIVE) {
      throw new BusinessException(ErrorCodes.MEMBER_NOT_ACTIVE, '会员状态不是正常状态');
    }
  }

  private assertPackageCanUse(plan: PackagePlan | null): asserts plan is PackagePlan {
    if (!plan) throw new BusinessException(ErrorCodes.PACKAGE_NOT_FOUND, '套餐不存在', 404);
    if (!plan.active) throw new BusinessException(ErrorCodes.PACKAGE_INACTIVE, '套餐已停用');
  }
}
