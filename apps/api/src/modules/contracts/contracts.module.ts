import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    PrismaModule,
    LoansModule, // karena pakai LoanCalculationService
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService], // kalau nanti dipakai module lain
})
export class ContractsModule {}
