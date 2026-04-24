import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessModule } from './modules/access/access.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MemberCardsModule } from './modules/member-cards/member-cards.module';
import { MembersModule } from './modules/members/members.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PresenceModule } from './modules/presence/presence.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MembersModule,
    TrainersModule,
    PackagesModule,
    MemberCardsModule,
    AppointmentsModule,
    AccessModule,
    PresenceModule,
    PaymentsModule,
    DashboardModule
  ]
})
export class AppModule {}
