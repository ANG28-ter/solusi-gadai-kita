import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoanReadService } from './loans-read.service';

import { LoanCalculationService } from './services/loans-calculation.service';

import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';

import { LoanDecisionsController } from './decisions/loans-decisions.controller';
import { LoanDecisionsService } from './decisions/loans-decisions.service';

import { AuctionModule } from './auctions/auction.module';
import { AuctionSettlementModule } from './auctions/settlements/auction-settlement.module';

import { LoanPolicyService } from './estimate/loan-policy.service';
import { LoanDecisionsModule } from './decisions/loans-decision.module';

@Module({
  imports: [
    PrismaModule,
    AuctionModule,
    LoanDecisionsModule,
    AuctionSettlementModule,
  ],

  controllers: [LoansController, PaymentsController, LoanDecisionsController],

  providers: [
    // COMMAND / OPERATIONAL
    LoansService,
    LoanCalculationService,
    LoanPolicyService,

    PaymentsService,
    LoanDecisionsService,

    // READ MODEL (AUDIT)
    LoanReadService,
  ],
  exports: [LoansService, LoanCalculationService],
})
export class LoansModule {}
