import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { TransactionReportReadService } from './transaction-report.read.service';
import { getBranchFilter, extractSelectedBranch } from '../../../common/utils/branch-filter';

@Controller('/api/v1/reports/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionReportController {
  constructor(
    private readonly transactionReportReadService: TransactionReportReadService,
  ) { }

  @Get()
  async getTransactionReport(
    @Req() req: Request & { user: { branchId: string; role: string } },
    @Headers() headers: any,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('q') q?: string,
    @Query('includeExpenses') includeExpensesStr?: string,
  ) {
    /**
     * 1️⃣ VALIDASI QUERY PARAM DASAR
     */
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('Query startDate dan endDate wajib diisi');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Format startDate / endDate tidak valid (ISO date)',
      );
    }

    // ✅ FIX: Set endDate to end of day (23:59:59.999) to include same-day transactions
    endDate.setHours(23, 59, 59, 999);

    /**
     * includeExpenses opsional
     * default = false
     */
    const includeExpenses =
      includeExpensesStr === 'true' || includeExpensesStr === '1';

    // Get branch filter (support Manager branch selection)
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);

    /**
     * 2️⃣ PANGGIL READ SERVICE
     */
    const result = await this.transactionReportReadService.getReport({
      branchId: filter.branchId,
      startDate,
      endDate,
      q,
      includeExpenses,
    });

    /**
     * 3️⃣ RESPONSE CONTRACT
     */
    return {
      data: result.data,
      summary: result.summary,
      meta: result.meta,
    };
  }
}
