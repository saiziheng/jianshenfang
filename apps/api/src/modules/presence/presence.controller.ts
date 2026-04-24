import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentAdmin, CurrentAdminUser } from '../../common/decorators/current-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ManualCorrectionDto } from './dto/manual-correction.dto';
import { PresenceService } from './presence.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Get('summary')
  summary() {
    return this.presence.summary();
  }

  @Get('current-members')
  currentMembers() {
    return this.presence.currentMembers();
  }

  @Post('corrections')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  correct(@Body() dto: ManualCorrectionDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.presence.correct(dto, admin.sub);
  }
}
