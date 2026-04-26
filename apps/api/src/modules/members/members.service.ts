import { Injectable } from '@nestjs/common';
import { CardStatus, MemberStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { APP_TZ } from '../../common/utils/date';
import { CreateMemberDto } from './dto/create-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    await this.assertPhoneAvailable(dto.phone);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const memberNo = await this.nextMemberNo(attempt);
        return await this.prisma.member.create({
          data: {
            memberNo,
            name: dto.name,
            phone: dto.phone,
            gender: dto.gender,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
            note: dto.note
          }
        });
      } catch (e: any) {
        if (e?.code !== 'P2002' || attempt === 4) throw e;
      }
    }
  }

  async list(query: QueryMembersDto) {
    const where: Prisma.MemberWhereInput = {
      status: query.status,
      ...(query.keyword
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: query.keyword } },
                  { phone: { contains: query.keyword } },
                  { memberNo: { contains: query.keyword } }
                ]
              }
            ]
          }
        : {})
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          cards: {
            where: { status: CardStatus.ACTIVE },
            orderBy: { createdAt: 'desc' }
          },
          presence: true
        }
      }),
      this.prisma.member.count({ where })
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async detail(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          include: { package: true }
        },
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 20,
          include: { trainer: true, memberCard: true }
        },
        accessLogs: {
          orderBy: { happenedAt: 'desc' },
          take: 50,
          include: { memberCard: true }
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 20
        },
        presence: true
      }
    });
    if (!member) {
      throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);
    }

    const now = new Date();
    const currentCard =
      member.cards.find((card) => {
        const validDate = !card.endDate || card.endDate >= now;
        return card.status === CardStatus.ACTIVE && validDate;
      }) ?? null;

    return {
      ...member,
      currentCard,
      summary: currentCard
        ? {
            remainingVisits: currentCard.remainingVisits,
            remainingLessons: currentCard.remainingLessons,
            remainingDays: currentCard.endDate
              ? Math.max(0, Math.ceil((currentCard.endDate.getTime() - now.getTime()) / 86400000))
              : null
          }
        : null
    };
  }

  async update(id: string, dto: UpdateMemberDto) {
    await this.ensureExists(id);
    await this.assertPhoneAvailable(dto.phone, id);
    return this.prisma.member.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        note: dto.note,
        status: dto.status
      }
    });
  }

  async ensureActive(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);
    if (member.status !== MemberStatus.ACTIVE) {
      throw new BusinessException(ErrorCodes.MEMBER_NOT_ACTIVE, '会员状态不是正常状态');
    }
    return member;
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.member.count({ where: { id } });
    if (!count) throw new BusinessException(ErrorCodes.MEMBER_NOT_FOUND, '会员不存在', 404);
  }

  private async assertPhoneAvailable(phone?: string, excludeId?: string) {
    if (!phone) return;
    const existing = await this.prisma.member.findFirst({
      where: { phone, id: excludeId ? { not: excludeId } : undefined },
      select: { id: true }
    });
    if (existing) {
      throw new BusinessException(ErrorCodes.MEMBER_PHONE_DUPLICATE, '手机号已被注册', 409);
    }
  }

  private async nextMemberNo(attempt: number) {
    const count = await this.prisma.member.count();
    const date = dayjs().tz(APP_TZ).format('YYYYMMDD');
    return `M${date}${String(count + 1 + attempt).padStart(5, '0')}`;
  }
}
