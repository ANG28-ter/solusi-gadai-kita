import { Module } from '@nestjs/common';
import { LoanDecisionsController } from './loans-decisions.controller';
import { LoanDecisionsService } from './loans-decisions.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [LoanDecisionsController],
  providers: [LoanDecisionsService, PrismaService],
  exports: [LoanDecisionsService],
})
export class LoanDecisionsModule {}
