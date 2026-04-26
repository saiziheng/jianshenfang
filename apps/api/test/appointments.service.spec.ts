import { AppointmentStatus, CardStatus, MemberStatus, PackageType } from '@prisma/client';
import { BusinessException } from '../src/common/business-error';
import { ErrorCodes } from '../src/common/error-codes';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    $transaction: jest.fn(async (callback) => callback(prisma)),
    member: {
      findUnique: jest.fn(async () => ({ id: 'member-1', status: MemberStatus.ACTIVE }))
    },
    trainer: {
      findUnique: jest.fn(async () => ({ id: 'trainer-1', active: true }))
    },
    memberCard: {
      findUnique: jest.fn(async () => ({
        id: 'card-1',
        memberId: 'member-1',
        type: PackageType.PT_CARD,
        status: CardStatus.ACTIVE,
        remainingLessons: 3,
        endDate: null
      })),
      updateMany: jest.fn()
    },
    appointment: {
      findFirst: jest.fn(async () => null),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(async (args) => ({
        id: 'appointment-1',
        status: AppointmentStatus.BOOKED,
        ...args.data
      }))
    }
  };
  return Object.assign(prisma, overrides);
}

describe('AppointmentsService', () => {
  const adminActor = { role: 'SUPER_ADMIN' };

  it('blocks trainer time conflict', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findFirst = jest.fn(async (args) =>
      args.where.trainerId === 'trainer-1' ? { id: 'conflict-1' } : null
    );
    const service = new AppointmentsService(prisma);

    await expect(
      service.create({
        memberId: 'member-1',
        trainerId: 'trainer-1',
        memberCardId: 'card-1',
        startAt: '2026-05-01T10:00:00.000Z',
        endAt: '2026-05-01T11:00:00.000Z'
      }, adminActor)
    ).rejects.toMatchObject<Partial<BusinessException>>({
      code: ErrorCodes.APPOINTMENT_CONFLICT_TRAINER
    });
  });

  it('blocks booking when private lesson balance is not enough', async () => {
    const prisma = buildPrisma();
    prisma.memberCard.findUnique = jest.fn(async () => ({
      id: 'card-1',
      memberId: 'member-1',
      type: PackageType.PT_CARD,
      status: CardStatus.ACTIVE,
      remainingLessons: 0,
      endDate: null
    }));
    const service = new AppointmentsService(prisma);

    await expect(
      service.create({
        memberId: 'member-1',
        trainerId: 'trainer-1',
        memberCardId: 'card-1',
        startAt: '2026-05-01T10:00:00.000Z',
        endAt: '2026-05-01T11:00:00.000Z'
      }, adminActor)
    ).rejects.toMatchObject<Partial<BusinessException>>({
      code: ErrorCodes.CARD_LESSONS_NOT_ENOUGH
    });
  });

  it('deducts one private lesson when appointment is completed', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findUnique = jest.fn(async () => ({
      id: 'appointment-1',
      memberCardId: 'card-1',
      trainerId: 'trainer-1',
      status: AppointmentStatus.BOOKED
    }));
    prisma.memberCard.updateMany = jest.fn(async () => ({ count: 1 }));
    prisma.appointment.update = jest.fn(async () => ({
      id: 'appointment-1',
      status: AppointmentStatus.COMPLETED
    }));
    const service = new AppointmentsService(prisma);

    await service.complete('appointment-1', adminActor);

    expect(prisma.memberCard.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'card-1',
          type: PackageType.PT_CARD,
          remainingLessons: { gt: 0 }
        }),
        data: { remainingLessons: { decrement: 1 } }
      })
    );
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: AppointmentStatus.COMPLETED })
      })
    );
  });

  it('complete 对 startAt 在未来的预约应抛 APPOINTMENT_STATUS_INVALID', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findUnique = jest.fn(async () => ({
      id: 'appointment-1',
      memberCardId: 'card-1',
      trainerId: 'trainer-1',
      startAt: new Date(Date.now() + 3600_000),
      status: AppointmentStatus.BOOKED
    }));
    const service = new AppointmentsService(prisma);

    await expect(service.complete('appointment-1', adminActor)).rejects.toMatchObject<Partial<BusinessException>>({
      code: ErrorCodes.APPOINTMENT_STATUS_INVALID
    });
    expect(prisma.memberCard.updateMany).not.toHaveBeenCalled();
  });

  it('TRAINER 角色操作其他教练的预约应抛 FORBIDDEN_ROLE', async () => {
    const prisma = buildPrisma();
    prisma.appointment.findUnique = jest.fn(async () => ({
      id: 'appointment-1',
      memberCardId: 'card-1',
      trainerId: 'trainer-1',
      startAt: new Date(Date.now() - 3600_000),
      status: AppointmentStatus.BOOKED
    }));
    const service = new AppointmentsService(prisma);

    await expect(
      service.complete('appointment-1', { role: 'TRAINER', trainerId: 'trainer-2' })
    ).rejects.toMatchObject<Partial<BusinessException>>({
      code: ErrorCodes.FORBIDDEN_ROLE
    });
  });
});
