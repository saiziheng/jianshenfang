import { Injectable } from '@nestjs/common';
import { AccessDirection, AccessResult, AppointmentStatus, CardStatus, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, startOfToday } from '../../common/utils/date';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const warningDate = addDays(today, 7);

    const [
      currentPresence,
      todayIn,
      todayOut,
      activeMembers,
      todayAppointments,
      expiringCards,
      lowVisitCards,
      lowLessonCards,
      latestAccessLogs
    ] = await this.prisma.$transaction([
      this.prisma.memberPresence.count({ where: { inGym: true } }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.IN, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      }),
      this.prisma.accessLog.count({
        where: { direction: AccessDirection.OUT, result: AccessResult.ALLOWED, happenedAt: { gte: today } }
      }),
      this.prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
      this.prisma.appointment.count({
        where: { startAt: { gte: today, lt: tomorrow }, status: AppointmentStatus.BOOKED }
      }),
      this.prisma.memberCard.findMany({
        where: {
          status: CardStatus.ACTIVE,
          endDate: { lte: warningDate }
        },
        take: 10,
        include: { member: true, package: true },
        orderBy: { endDate: 'asc' }
      }),
      this.prisma.memberCard.findMany({
        where: { status: CardStatus.ACTIVE, remainingVisits: { lte: 3 } },
        take: 10,
        include: { member: true, package: true },
        orderBy: { remainingVisits: 'asc' }
      }),
      this.prisma.memberCard.findMany({
        where: { status: CardStatus.ACTIVE, remainingLessons: { lte: 3 } },
        take: 10,
        include: { member: true, package: true },
        orderBy: { remainingLessons: 'asc' }
      }),
      this.prisma.accessLog.findMany({
        take: 10,
        include: { member: true },
        orderBy: { happenedAt: 'desc' }
      })
    ]);

    const seen = new Map<string, typeof expiringCards[number]>();
    for (const card of [...expiringCards, ...lowVisitCards, ...lowLessonCards]) {
      if (!seen.has(card.id)) seen.set(card.id, card);
    }
    const cardWarnings = [...seen.values()];

    return {
      metrics: {
        currentPresence,
        todayIn,
        todayOut,
        activeMembers,
        todayAppointments
      },
      cardWarnings,
      warningGroups: {
        expiringCards,
        lowVisitCards,
        lowLessonCards
      },
      latestAccessLogs
    };
  }
}
