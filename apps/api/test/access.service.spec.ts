import { AccessDirection, AccessResult, CardStatus, MemberStatus, PackageType } from '@prisma/client';
import { AccessService } from '../src/modules/access/access.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    $transaction: jest.fn(async (callback) => callback(prisma)),
    member: {
      findUnique: jest.fn(async () => ({ id: 'member-1', status: MemberStatus.ACTIVE }))
    },
    memberPresence: {
      findUnique: jest.fn(async () => ({ memberId: 'member-1', inGym: true })),
      update: jest.fn(async (args) => args.data),
      create: jest.fn()
    },
    memberCard: {
      findFirst: jest.fn(async () => ({
        id: 'card-1',
        memberId: 'member-1',
        type: PackageType.VISIT_CARD,
        status: CardStatus.ACTIVE,
        remainingVisits: 0
      })),
      updateMany: jest.fn(async () => ({ count: 1 }))
    },
    accessLog: {
      create: jest.fn(async (args) => ({ id: 'log-1', ...args.data }))
    }
  };
  return Object.assign(prisma, overrides);
}

describe('AccessService', () => {
  it('does not count or deduct duplicated IN when member is already in gym', async () => {
    const prisma = buildPrisma();
    const service = new AccessService(prisma);

    const result = await service.verify({ memberId: 'member-1', direction: AccessDirection.IN });

    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('重复入场');
    expect(prisma.memberCard.updateMany).not.toHaveBeenCalled();
    expect(prisma.memberPresence.update).not.toHaveBeenCalled();
    expect(prisma.accessLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: AccessResult.ALLOWED,
          direction: AccessDirection.IN
        })
      })
    );
  });

  it('records abnormal OUT when member is not in gym', async () => {
    const prisma = buildPrisma({
      memberPresence: {
        findUnique: jest.fn(async () => null),
        update: jest.fn(),
        create: jest.fn()
      }
    });
    const service = new AccessService(prisma as any);

    const result = await service.verify({ memberId: 'member-1', direction: AccessDirection.OUT });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('异常离场');
    expect(prisma.memberPresence.update).not.toHaveBeenCalled();
    expect(prisma.accessLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: AccessResult.DENIED,
          direction: AccessDirection.OUT
        })
      })
    );
  });
});
