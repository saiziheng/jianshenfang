import { AccessDirection, AccessResult, CardStatus, MemberStatus, PackageType } from '@prisma/client';
import { AccessService } from '../src/modules/access/access.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    $transaction: jest.fn(async (callback) => callback(prisma)),
    $executeRaw: jest.fn(),
    member: {
      findUnique: jest.fn(async () => ({ id: 'member-1', status: MemberStatus.ACTIVE }))
    },
    memberPresence: {
      findUnique: jest.fn(async () => ({ memberId: 'member-1', inGym: true })),
      update: jest.fn(async (args) => args.data),
      create: jest.fn(),
      upsert: jest.fn(async (args) => args.update)
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

  it('已在馆会员再次刷 IN，即使卡已过期也应允许且不查卡不扣次', async () => {
    const prisma = buildPrisma({
      memberPresence: {
        findUnique: jest.fn(async () => ({ memberId: 'member-1', inGym: true })),
        update: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn()
      },
      memberCard: {
        findFirst: jest.fn(async () => {
          throw new Error('should not query card');
        }),
        updateMany: jest.fn()
      }
    });
    const service = new AccessService(prisma as any);

    const result = await service.verify({ memberId: 'member-1', direction: AccessDirection.IN });

    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('重复入场');
    expect(prisma.memberCard.findFirst).not.toHaveBeenCalled();
    expect(prisma.memberCard.updateMany).not.toHaveBeenCalled();
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

  it('denies IN when visit card balance is not enough', async () => {
    const prisma = buildPrisma({
      memberPresence: {
        findUnique: jest.fn(async () => null),
        update: jest.fn(),
        create: jest.fn()
      },
      memberCard: {
        findFirst: jest.fn(async () => ({
          id: 'card-1',
          memberId: 'member-1',
          type: PackageType.VISIT_CARD,
          status: CardStatus.ACTIVE,
          remainingVisits: 1
        })),
        updateMany: jest.fn(async () => ({ count: 0 }))
      }
    });
    const service = new AccessService(prisma as any);

    const result = await service.verify({ memberId: 'member-1', direction: AccessDirection.IN });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('次数不足');
    expect(prisma.memberPresence.create).not.toHaveBeenCalled();
    expect(prisma.accessLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: AccessResult.DENIED,
          direction: AccessDirection.IN
        })
      })
    );
  });
});
