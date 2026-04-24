import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentAdmin = {
  sub: string;
  username: string;
  role: string;
};

export const CurrentAdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentAdmin => ctx.switchToHttp().getRequest().user
);
