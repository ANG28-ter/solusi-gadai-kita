import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

import { TransactionReportController } from './transaction-report.controller';
import { TransactionReportReadService } from './transaction-report.read.service';
import { ReportSubmissionController } from './report-submission.controller';
import { ReportSubmissionService } from './report-submission.service';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, // hanya butuh Prisma
    NotificationsModule, // for notification triggers
  ],
  controllers: [
    TransactionReportController,
    ReportSubmissionController,
  ],
  providers: [
    TransactionReportReadService,
    ReportSubmissionService,
  ],
  /**
   * ⚠️ EXPORT POLICY
   * ----------------
   * - TIDAK export read service
   * - read model hanya via HTTP
   */
  exports: [],
})
export class ReportsModule { }
