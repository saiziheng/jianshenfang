import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PackageType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Get()
  list(@Query('type') type?: PackageType) {
    return this.packages.list(type);
  }

  @Post()
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  create(@Body() dto: CreatePackageDto) {
    return this.packages.create(dto);
  }

  @Patch(':id')
  @Roles(AppRole.SUPER_ADMIN, AppRole.FRONT_DESK)
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.update(id, dto);
  }
}
