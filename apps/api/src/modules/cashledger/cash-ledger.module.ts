import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CashLedgerController } from './cash-ledger.controller';
import { CashLedgerService } from './cash-ledger.service';

@Module({
  imports: [PrismaModule],
  controllers: [CashLedgerController],
  providers: [CashLedgerService],
  exports: [CashLedgerService],
})
export class CashLedgerModule { }
