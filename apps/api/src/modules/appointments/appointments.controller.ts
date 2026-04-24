import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(@Query('date') date?: string) {
    return this.appointments.list(date);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointments.create(dto);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointments.update(id, dto);
  }

  @Post(':id/cancel')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointments.cancel(id, dto.reason);
  }

  @Post(':id/complete')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  complete(@Param('id') id: string) {
    return this.appointments.complete(id);
  }

  @Post(':id/absent')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK, AppRole.TRAINER)
  markAbsent(@Param('id') id: string) {
    return this.appointments.markAbsent(id);
  }
}
