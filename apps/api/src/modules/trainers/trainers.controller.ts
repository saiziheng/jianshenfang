import { Body, Controller, Get, Patch, Post, Query, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainersService } from './trainers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainers: TrainersService) {}

  @Get()
  list(@Query('keyword') keyword?: string) {
    return this.trainers.list(keyword);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  create(@Body() dto: CreateTrainerDto) {
    return this.trainers.create(dto);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainers.update(id, dto);
  }
}
