import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAdmin, CurrentAdminUser } from '../../common/decorators/current-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(@Query() query: QueryAppointmentsDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.list(query, admin);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  create(@Body() dto: CreateAppointmentDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.create(dto, admin);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.update(id, dto, admin);
  }

  @Post(':id/cancel')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.cancel(id, dto.reason, admin);
  }

  @Post(':id/complete')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  complete(@Param('id') id: string, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.complete(id, admin);
  }

  @Post(':id/absent')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  markAbsent(@Param('id') id: string, @CurrentAdminUser() admin: CurrentAdmin) {
    return this.appointments.markAbsent(id, admin);
  }
}
