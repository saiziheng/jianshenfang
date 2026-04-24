import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {
      memberId: query.memberId,
      bizType: query.bizType
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: query.pageSize,
        include: { member: true, memberCard: true, package: true },
        orderBy: { paidAt: 'desc' }
      }),
      this.prisma.payment.count({ where })
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
