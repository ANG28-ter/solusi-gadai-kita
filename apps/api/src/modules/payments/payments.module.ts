import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanCalculationService } from '../loans/services/loans-calculation.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PrismaService,
    LoanCalculationService,
  ],
  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule { }
