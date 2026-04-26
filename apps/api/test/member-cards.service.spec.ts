import { CardStatus, MemberStatus, PackageType, PaymentMethod } from '@prisma/client';
import { BusinessException } from '../src/common/business-error';
import { ErrorCodes } from '../src/common/error-codes';
import { MemberCardsService } from '../src/modules/member-cards/member-cards.service';

describe('MemberCardsService', () => {
  it('opens a card and writes payment in one transaction', async () => {
    const prisma: any = {
      $transaction: jest.fn(async (callback) => callback(prisma)),
      member: {
        findUnique: jest.fn(async () => ({ id: 'member-1', status: MemberStatus.ACTIVE }))
      },
      packagePlan: {
        findUnique: jest.fn(async () => ({
          id: 'package-1',
          name: '10 节私教卡',
          type: PackageType.PT_CARD,
          active: true,
          durationDays: 180,
          totalVisits: null,
          totalLessons: 10
        }))
      },
      memberCard: {
        create: jest.fn(async (args) => ({ id: 'card-1', ...args.data }))
      },
      payment: {
        create: jest.fn(async (args) => ({ id: 'payment-1', ...args.data }))
      }
    };
    const service = new MemberCardsService(prisma);

    const result = await service.openCard({
      memberId: 'member-1',
      packageId: 'package-1',
      amount: 2800,
      method: PaymentMethod.WECHAT
    });

    expect(result.card.remainingLessons).toBe(10);
    expect(result.payment.memberCardId).toBe('card-1');
    expect(prisma.memberCard.create).toHaveBeenCalledTimes(1);
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it('renews a visit card and writes payment', async () => {
    const prisma: any = {
      $transaction: jest.fn(async (callback) => callback(prisma)),
      memberCard: {
        findUnique: jest.fn(async () => ({
          id: 'card-1',
          memberId: 'member-1',
          packageId: 'package-1',
          type: PackageType.VISIT_CARD,
          status: CardStatus.ACTIVE,
          endDate: null,
          member: { id: 'member-1', status: MemberStatus.ACTIVE },
          package: {
            id: 'package-1',
            type: PackageType.VISIT_CARD,
            active: true,
            totalVisits: 10,
            durationDays: 90
          }
        })),
        update: jest.fn(async (args) => ({ id: 'card-1', ...args.data }))
      },
      packagePlan: {
        findUnique: jest.fn()
      },
      payment: {
        create: jest.fn(async (args) => ({ id: 'payment-1', ...args.data }))
      }
    };
    const service = new MemberCardsService(prisma);

    const result = await service.renewCard({
      memberCardId: 'card-1',
      addVisits: 10,
      amount: 599,
      method: PaymentMethod.ALIPAY
    });

    expect(result.card.remainingVisits).toEqual({ increment: 10 });
    expect(result.payment.bizType).toBe('RENEW_CARD');
    expect(prisma.memberCard.update).toHaveBeenCalledTimes(1);
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it('VISIT_CARD 续卡时若 card.endDate 未过期，endDate 应从原到期日延期', async () => {
    const currentEnd = new Date(Date.now() + 10 * 86400000);
    const prisma: any = {
      $transaction: jest.fn(async (callback) => callback(prisma)),
      memberCard: {
        findUnique: jest.fn(async () => ({
          id: 'card-1',
          memberId: 'member-1',
          packageId: 'package-1',
          type: PackageType.VISIT_CARD,
          status: CardStatus.ACTIVE,
          endDate: currentEnd,
          member: { id: 'member-1', status: MemberStatus.ACTIVE },
          package: {
            id: 'package-1',
            type: PackageType.VISIT_CARD,
            active: true,
            totalVisits: 10,
            durationDays: 90
          }
        })),
        update: jest.fn(async (args) => ({ id: 'card-1', ...args.data }))
      },
      packagePlan: {
        findUnique: jest.fn()
      },
      payment: {
        create: jest.fn(async (args) => ({ id: 'payment-1', ...args.data }))
      }
    };
    const service = new MemberCardsService(prisma);

    await service.renewCard({
      memberCardId: 'card-1',
      addVisits: 10,
      amount: 599,
      method: PaymentMethod.ALIPAY
    });

    const updateArg = prisma.memberCard.update.mock.calls[0][0];
    expect(updateArg.data.endDate.getTime()).toBe(currentEnd.getTime() + 90 * 86400000);
  });

  it('续卡套餐类型与原卡不一致时应抛 PACKAGE_RULE_INVALID', async () => {
    const prisma: any = {
      $transaction: jest.fn(async (callback) => callback(prisma)),
      memberCard: {
        findUnique: jest.fn(async () => ({
          id: 'card-1',
          memberId: 'member-1',
          packageId: 'package-1',
          type: PackageType.VISIT_CARD,
          status: CardStatus.ACTIVE,
          endDate: null,
          member: { id: 'member-1', status: MemberStatus.ACTIVE },
          package: {
            id: 'package-1',
            type: PackageType.VISIT_CARD,
            active: true,
            totalVisits: 10,
            durationDays: 90
          }
        })),
        update: jest.fn()
      },
      packagePlan: {
        findUnique: jest.fn(async () => ({
          id: 'package-2',
          type: PackageType.PT_CARD,
          active: true,
          totalLessons: 10,
          durationDays: 90
        }))
      },
      payment: {
        create: jest.fn()
      }
    };
    const service = new MemberCardsService(prisma);

    await expect(
      service.renewCard({
        memberCardId: 'card-1',
        packageId: 'package-2',
        addVisits: 10,
        amount: 599,
        method: PaymentMethod.ALIPAY
      })
    ).rejects.toMatchObject<Partial<BusinessException>>({
      code: ErrorCodes.PACKAGE_RULE_INVALID
    });
  });

  it('returns expiring and low balance card warnings', async () => {
    const warningCard = { id: 'card-1', status: CardStatus.ACTIVE, remainingVisits: 2 };
    const prisma: any = {
      memberCard: {
        findMany: jest.fn(async () => [warningCard])
      }
    };
    const service = new MemberCardsService(prisma);

    const result = await service.warnings();

    expect(result).toEqual([warningCard]);
    expect(prisma.memberCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: CardStatus.ACTIVE,
          OR: expect.any(Array)
        })
      })
    );
  });
});
