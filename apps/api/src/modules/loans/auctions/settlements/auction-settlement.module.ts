import { Module } from '@nestjs/common';
import { AuctionSettlementService } from './auction-settlement.service';
import { AuctionSettlementController } from './auction-settlement.controller';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  controllers: [AuctionSettlementController],
  providers: [AuctionSettlementService, PrismaService],
})
export class AuctionSettlementModule {}
