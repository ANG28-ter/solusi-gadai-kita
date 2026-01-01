import { Module } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { PrismaService } from '../../../prisma/prisma.service';

import { LoanCalculationService } from '../services/loans-calculation.service';

@Module({
  controllers: [AuctionController],
  providers: [AuctionService, PrismaService, LoanCalculationService],
})
export class AuctionModule { }
