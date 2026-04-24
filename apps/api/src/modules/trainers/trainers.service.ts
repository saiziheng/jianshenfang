import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTrainerDto) {
    return this.prisma.trainer.create({ data: dto });
  }

  list(keyword?: string) {
    return this.prisma.trainer.findMany({
      where: keyword
        ? {
            OR: [{ name: { contains: keyword } }, { phone: { contains: keyword } }]
          }
        : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, dto: UpdateTrainerDto) {
    await this.ensureExists(id);
    return this.prisma.trainer.update({ where: { id }, data: dto });
  }

  async ensureActive(id: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer) throw new BusinessException(ErrorCodes.TRAINER_NOT_FOUND, '教练不存在', 404);
    if (!trainer.active) {
      throw new BusinessException(ErrorCodes.TRAINER_INACTIVE, '教练已停用');
    }
    return trainer;
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.trainer.count({ where: { id } });
    if (!count) throw new BusinessException(ErrorCodes.TRAINER_NOT_FOUND, '教练不存在', 404);
  }
}
