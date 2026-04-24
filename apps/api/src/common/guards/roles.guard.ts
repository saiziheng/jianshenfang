import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BusinessException } from '../business-error';
import { ErrorCodes } from '../error-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user;
    if (user?.role === AppRole.SUPER_ADMIN || required.includes(user?.role)) {
      return true;
    }

    throw new BusinessException(ErrorCodes.FORBIDDEN_ROLE, '当前账号无权执行该操作', 403);
  }
}
