import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateMemberDto } from './dto/create-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  list(@Query() query: QueryMembersDto) {
    return this.members.list(query);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  create(@Body() dto: CreateMemberDto) {
    return this.members.create(dto);
  }

  @Get(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  detail(@Param('id') id: string) {
    return this.members.detail(id);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }
}
