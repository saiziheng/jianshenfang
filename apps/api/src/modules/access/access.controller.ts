import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAdminUser, CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccessService } from './access.service';
import { AccessVerifyDto } from './dto/access-verify.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('access')
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Post('verify')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  verify(@Body() dto: AccessVerifyDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.access.verify(dto, admin?.sub);
  }

  @Get('logs')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  logs(@Query() query: QueryAccessLogsDto) {
    return this.access.logs(query);
  }
}
