import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddCardBalanceDto } from './dto/add-card-balance.dto';
import { ChangeCardDto } from './dto/change-card.dto';
import { OpenCardDto } from './dto/open-card.dto';
import { RenewCardDto } from './dto/renew-card.dto';
import { MemberCardsService } from './member-cards.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('member-cards')
export class MemberCardsController {
  constructor(private readonly cards: MemberCardsService) {}

  @Post('open')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  openCard(@Body() dto: OpenCardDto) {
    return this.cards.openCard(dto);
  }

  @Post('renew')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  renewCard(@Body() dto: RenewCardDto) {
    return this.cards.renewCard(dto);
  }

  @Post('change')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  changeCard(@Body() dto: ChangeCardDto) {
    return this.cards.changeCard(dto);
  }

  @Post('add-balance')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  addBalance(@Body() dto: AddCardBalanceDto) {
    return this.cards.addBalance(dto);
  }

  @Get('warnings')
  warnings() {
    return this.cards.warnings();
  }
}
