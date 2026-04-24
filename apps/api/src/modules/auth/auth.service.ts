import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/business-error';
import { ErrorCodes } from '../../common/error-codes';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { username: dto.username } });
    if (!admin) {
      throw new BusinessException(ErrorCodes.AUTH_INVALID_CREDENTIALS, '用户名或密码错误', 401);
    }
    if (!admin.active) {
      throw new BusinessException(ErrorCodes.AUTH_INACTIVE_ADMIN, '账号已停用', 403);
    }

    const ok = await compare(dto.password, admin.passwordHash);
    if (!ok) {
      throw new BusinessException(ErrorCodes.AUTH_INVALID_CREDENTIALS, '用户名或密码错误', 401);
    }

    const payload = { sub: admin.id, username: admin.username, role: admin.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    };
  }
}
