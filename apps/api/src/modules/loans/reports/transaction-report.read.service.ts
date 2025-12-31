import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TransactionReportQuery,
  TransactionReportResult,
} from './dto/transaction-report.dto';

function assertDateRange(startDate: Date, endDate: Date) {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new BadRequestException('startDate tidak valid');
  }
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new BadRequestException('endDate tidak valid');
  }
  if (endDate < startDate) {
    throw new BadRequestException('endDate harus >= startDate');
  }
}

function normalizeSearch(q?: string): string | undefined {
  const s = (q ?? '').trim();
  return s.length ? s : undefined;
}

@Injectable()
export class TransactionReportReadService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * READ-ONLY transaction report (period-based)
   * - sources: Payment (IN), AuctionSettlement (IN), optional CashLedger OUT (Expense)
   * - filters:
   *   - branchId (required)
   *   - date range (required)
   *   - q (optional)
   * - audit-safety:
   *   - Payment: reversedAt must be null AND cashLedger.status = POSTED (if exists)
   *   - AuctionSettlement: cashLedger.status = POSTED (if exists)
   *   - Expenses: cashLedger.type=OUT, status=POSTED
   */
  async getReport(
    query: TransactionReportQuery,
  ): Promise<TransactionReportResult> {
    const q = normalizeSearch(query.q);
    const includeExpenses = query.includeExpenses ?? false;

    assertDateRange(query.startDate, query.endDate);

    // ========== 1) PAYMENTS (IN) ==========
    const paymentRows = await this.prisma.payment.findMany({
      where: {
        branchId: query.branchId,
        paidAt: { gte: query.startDate, lte: query.endDate },
        reversedAt: null,
        // Relaxed mode: allow both payments with and without cash ledger
        // - New payments (after cash ledger integration): has cashLedger.status = POSTED
        // - Legacy payments (before integration): cashLedger is null
        OR: [
          { cashLedger: { status: 'POSTED' } },
          { cashLedger: null },
        ],

        ...(q
          ? {
            OR: [
              { note: { contains: q, mode: 'insensitive' } },
              { loan: { code: { contains: q, mode: 'insensitive' } } },
            ],
          }
          : {}),
      },
      select: {
        id: true,
        paidAt: true,
        amountRp: true,
        loanId: true,
        loan: { select: { code: true } },
        cashLedger: { select: { id: true } },
      },
      orderBy: { paidAt: 'asc' },
    });

    const paymentReport = paymentRows.map((p) => ({
      date: p.paidAt,
      name: `Pembayaran Gadai - ${p.loan.code}`,
      inRp: p.amountRp,
      outRp: 0,
      ref: {
        type: 'PAYMENT' as const,
        paymentId: p.id,
        cashLedgerId: p.cashLedger?.id,
        loanId: p.loanId,
        loanCode: p.loan.code,
      },
    }));

    // ========== 2) AUCTION SETTLEMENTS (IN) ==========
    const auctionRows = await this.prisma.auctionSettlement.findMany({
      where: {
        branchId: query.branchId,
        settledAt: { gte: query.startDate, lte: query.endDate },
        cashLedger: { status: 'POSTED' },
        ...(q
          ? {
            OR: [
              { note: { contains: q, mode: 'insensitive' } },
              {
                auction: {
                  loan: { code: { contains: q, mode: 'insensitive' } },
                },
              },
            ],
          }
          : {}),
      },
      select: {
        id: true,
        settledAt: true,
        netAmountRp: true,
        auctionId: true,
        auction: {
          select: {
            loanId: true,
            loan: { select: { code: true } },
          },
        },
        cashLedger: { select: { id: true } },
      },
      orderBy: { settledAt: 'asc' },
    });

    const auctionReport = auctionRows.map((a) => ({
      date: a.settledAt,
      name: `Hasil Lelang - ${a.auction.loan.code}`,
      inRp: a.netAmountRp,
      outRp: 0,
      ref: {
        type: 'AUCTION' as const,
        auctionSettlementId: a.id,
        cashLedgerId: a.cashLedger?.id,
        loanId: a.auction.loanId,
        loanCode: a.auction.loan.code,
      },
    }));

    // ========== 2.5) MANUAL INCOME (IN) ==========
    const manualIncomeRows = await this.prisma.cashLedger.findMany({
      where: {
        branchId: query.branchId,
        type: 'IN',
        source: 'MANUAL',
        status: 'POSTED',
        txnDate: { gte: query.startDate, lte: query.endDate },
        ...(q
          ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { note: { contains: q, mode: 'insensitive' } },
            ],
          }
          : {}),
      },
      select: {
        id: true,
        txnDate: true,
        amountRp: true,
        title: true,
        note: true,
        source: true,
      },
      orderBy: { txnDate: 'asc' },
    });

    const manualIncomeReport = manualIncomeRows.map((e) => {
      let name = e.title;
      // Handle potential legacy titles if they ended up in manual source
      if (name === 'Payment Loan') name = 'Pembayaran Gadai';

      return {
        date: e.txnDate,
        name,
        inRp: e.amountRp,
        outRp: 0,
        ref: {
          type: 'MANUAL_IN' as const,
          cashLedgerId: e.id,
        },
      };
    });

    // ========== 3) EXPENSES (OUT) — optional ==========
    // Even though user said CashLedger is a different page, expenses for "Laporan Transaksi"
    // commonly include OUT flows. Keep optional so UI can decide.
    let expenseReport: Array<{
      date: Date;
      name: string;
      inRp: number;
      outRp: number;
      ref: any;
    }> = [];

    if (includeExpenses) {
      const expenseRows = await this.prisma.cashLedger.findMany({
        where: {
          branchId: query.branchId,
          type: 'OUT',
          status: 'POSTED',
          txnDate: { gte: query.startDate, lte: query.endDate },
          ...(q
            ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { note: { contains: q, mode: 'insensitive' } },
              ],
            }
            : {}),
        },
        select: {
          id: true,
          txnDate: true,
          amountRp: true,
          title: true,
          note: true,
          source: true,
        },
        orderBy: { txnDate: 'asc' },
      });

      expenseReport = expenseRows.map((e) => {
        let name = e.title;
        if (name === 'Reversal Payment') name = 'Pembatalan Pembayaran';
        if (name === 'Payment Loan') name = 'Pembayaran Gadai';

        return {
          date: e.txnDate,
          name,
          inRp: 0,
          outRp: e.amountRp,
          ref: {
            type: 'EXPENSE' as const,
            cashLedgerId: e.id,
          },
        };
      });
    }

    // ========== 4) MERGE + SORT ==========
    const merged = [...paymentReport, ...auctionReport, ...manualIncomeReport, ...expenseReport];

    merged.sort((a, b) => {
      const t1 = a.date.getTime();
      const t2 = b.date.getTime();
      if (t1 !== t2) return t1 - t2;
      return a.name.localeCompare(b.name);
    });

    // ========== 5) SUMMARY ==========
    let totalIn = 0;
    let totalOut = 0;

    for (const r of merged) {
      totalIn += r.inRp;
      totalOut += r.outRp;
    }

    const resultRows = merged.map((r, idx) => ({
      no: idx + 1,
      date: r.date,
      name: r.name,
      pemasukanRp: r.inRp,
      pengeluaranRp: r.outRp,
      ref: r.ref,
    }));

    return {
      data: resultRows,
      summary: {
        totalPemasukanRp: totalIn,
        totalPengeluaranRp: totalOut,
        saldoRp: totalIn - totalOut,
      },
      meta: {
        branchId: query.branchId,
        period: { from: query.startDate, to: query.endDate },
        generatedAt: new Date(),
        includeExpenses,
        ...(q ? { q } : {}),
      },
    };
  }
}
