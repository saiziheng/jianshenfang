import { Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  CardStatus,
  MemberStatus,
  PackageType,
  Prisma
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type BookableInput = {
  memberId: string;
  trainerId: string;
  memberCardId: string;
  startAt: Date;
  endAt: Date;
  excludeAppointmentId?: string;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const input = this.parseInput(dto);
      await this.assertBookable(tx, input);
      return tx.appointment.create({
        data: {
          memberId: input.memberId,
          trainerId: input.trainerId,
          memberCardId: input.memberCardId,
          startAt: input.startAt,
          endAt: input.endAt,
          status: AppointmentStatus.BOOKED
        },
        include: { member: true, trainer: true, memberCard: true }
      });
    });
  }

  list(date?: string) {
    const where: Prisma.AppointmentWhereInput = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.startAt = { gte: start, lt: end };
    }

    return this.prisma.appointment.findMany({
      where,
      include: { member: true, trainer: true, memberCard: true },
      orderBy: { startAt: 'asc' }
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({ where: { id } });
      if (!current) throw new BusinessException(ErrorCodes.APPOINTMENT_NOT_FOUND, '预约不存在', 404);
      if (current.status !== AppointmentStatus.BOOKED) {
        throw new BusinessException(ErrorCodes.APPOINTMENT_STATUS_INVALID, '只有已预约课程可以修改');
      }

      const input = this.parseInput({
        memberId: current.memberId,
        trainerId: dto.trainerId ?? current.trainerId,
        memberCardId: dto.memberCardId ?? current.memberCardId,
        startAt: dto.startAt,
        endAt: dto.endAt
      });
      input.excludeAppointmentId = id;
      await this.assertBookable(tx, input);

      return tx.appointment.update({
        where: { id },
        data: {
          trainerId: input.trainerId,
          memberCardId: input.memberCardId,
          startAt: input.startAt,
          endAt: input.endAt
        },
        include: { member: true, trainer: true, memberCard: true }
      });
    });
  }

  async cancel(id: string, reason?: string) {
    const updated = await this.prisma.appointment.updateMany({
      where: { id, status: AppointmentStatus.BOOKED },
      data: { status: AppointmentStatus.CANCELLED, cancelReason: reason }
    });
    if (!updated.count) {
      throw new BusinessException(ErrorCodes.APPOINTMENT_STATUS_INVALID, '只有已预约课程可以取消');
    }
    return this.prisma.appointment.findUnique({ where: { id }, include: { member: true, trainer: true } });
  }

  async complete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id },
        include: { memberCard: true }
      });
      if (!appointment) throw new BusinessException(ErrorCodes.APPOINTMENT_NOT_FOUND, '预约不存在', 404);
      if (appointment.status !== AppointmentStatus.BOOKED) {
        throw new BusinessException(ErrorCodes.APPOINTMENT_STATUS_INVALID, '只有已预约课程可以完成');
      }

      const cardUpdate = await tx.memberCard.updateMany({
        where: {
          id: appointment.memberCardId,
          type: PackageType.PT_CARD,
          status: CardStatus.ACTIVE,
          remainingLessons: { gt: 0 }
        },
        data: {
          remainingLessons: { decrement: 1 }
        }
      });
      if (!cardUpdate.count) {
        throw new BusinessException(ErrorCodes.CARD_LESSONS_NOT_ENOUGH, '私教课时不足，无法完成消课');
      }

      await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      return tx.appointment.findUnique({
        where: { id },
        include: { member: true, trainer: true, memberCard: true }
      });
    });
  }

  async markAbsent(id: string) {
    const updated = await this.prisma.appointment.updateMany({
      where: { id, status: AppointmentStatus.BOOKED },
      data: { status: AppointmentStatus.ABSENT }
    });
    if (!updated.count) {
      throw new BusinessException(ErrorCodes.APPOINTMENT_STATUS_INVALID, '只有已预约课程可以标记缺席');
    }
    return this.prisma.appointment.findUnique({ where: { id }, include: { member: true, trainer: true } });
  }

  private parseInput(dto: CreateAppointmentDto): BookableInput {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
      throw new BusinessException(ErrorCodes.APPOINTMENT_TIME_INVALID, '预约时间不合法');
    }
    return {
      memberId: dto.memberId,
      trainerId: dto.trainerId,
      memberCardId: dto.memberCardId,
      startAt,
      endAt
    };
  }

  private async assertBookable(tx: Prisma.TransactionClient, input: BookableInput) {
    const [member, trainer, card] = await Promise.all([
      tx.member.findUnique({ where: { id: input.memberId } }),
      tx.trainer.findUnique({ where: { id: input.trainerId } }),
      tx.memberCard.findUnique({ where: { id: input.memberCardId } })
    ]);

    if (!member) throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);
    if (member.status !== MemberStatus.ACTIVE) {
      throw new BusinessException(ErrorCodes.MEMBER_NOT_ACTIVE, '会员状态不是正常状态');
    }
    if (!trainer) throw new BusinessException(ErrorCodes.TRAINER_NOT_FOUND, '教练不存在', 404);
    if (!trainer.active) throw new BusinessException(ErrorCodes.TRAINER_INACTIVE, '教练已停用');
    if (!card || card.memberId !== input.memberId) {
      throw new BusinessException(ErrorCodes.CARD_NOT_FOUND, '会员私教卡不存在', 404);
    }
    if (card.status !== CardStatus.ACTIVE) {
      throw new BusinessException(ErrorCodes.CARD_NOT_ACTIVE, '会员卡不是正常状态');
    }
    if (card.endDate && card.endDate < input.startAt) {
      throw new BusinessException(ErrorCodes.CARD_EXPIRED, '会员卡已过期');
    }
    if (card.type !== PackageType.PT_CARD || (card.remainingLessons ?? 0) <= 0) {
      throw new BusinessException(ErrorCodes.CARD_LESSONS_NOT_ENOUGH, '私教剩余课时不足');
    }

    const baseConflict: Prisma.AppointmentWhereInput = {
      status: AppointmentStatus.BOOKED,
      startAt: { lt: input.endAt },
      endAt: { gt: input.startAt },
      id: input.excludeAppointmentId ? { not: input.excludeAppointmentId } : undefined
    };

    const trainerConflict = await tx.appointment.findFirst({
      where: { ...baseConflict, trainerId: input.trainerId },
      select: { id: true }
    });
    if (trainerConflict) {
      throw new BusinessException(ErrorCodes.APPOINTMENT_CONFLICT_TRAINER, '教练该时段已有预约');
    }

    const memberConflict = await tx.appointment.findFirst({
      where: { ...baseConflict, memberId: input.memberId },
      select: { id: true }
    });
    if (memberConflict) {
      throw new BusinessException(ErrorCodes.APPOINTMENT_CONFLICT_MEMBER, '会员该时段已有预约');
    }
  }
}
