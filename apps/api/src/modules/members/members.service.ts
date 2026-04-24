import { Injectable } from '@nestjs/common';
import { CardStatus, MemberStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { CreateMemberDto } from './dto/create-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    const memberNo = await this.nextMemberNo();
    return this.prisma.member.create({
      data: {
        memberNo,
        name: dto.name,
        phone: dto.phone,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        note: dto.note
      }
    });
  }

  async list(query: QueryMembersDto) {
    const where: Prisma.MemberWhereInput = {
      status: query.status,
      OR: query.keyword
        ? [
            { name: { contains: query.keyword } },
            { phone: { contains: query.keyword } },
            { memberNo: { contains: query.keyword } }
          ]
        : undefined
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
            orderBy: { createdAt: 'desc' },
            take: 1
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

  private async nextMemberNo() {
    const count = await this.prisma.member.count();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `M${date}${String(count + 1).padStart(5, '0')}`;
  }
}
