import { Module } from '@nestjs/common';
import { MemberCardsController } from './member-cards.controller';
import { MemberCardsService } from './member-cards.service';

@Module({
  controllers: [MemberCardsController],
  providers: [MemberCardsService],
  exports: [MemberCardsService]
})
export class MemberCardsModule {}
