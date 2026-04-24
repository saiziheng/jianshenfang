import { MemberStatus, PackageType, PaymentMethod } from '@prisma/client';
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
});
