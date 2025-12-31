import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoanCalculationService } from '../services/loans-calculation.service';
import {
  LoanStatus,
  CashCategory,
  CashStatus,
  CashType,
  CashSource,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: LoanCalculationService,
  ) { }

  async recordPayment(
    loanId: string,
    input: { amountRp: number; note?: string; paidAt?: Date },
    user: { id: string; branchId: string },
  ) {
    if (!Number.isInteger(input.amountRp) || input.amountRp <= 0) {
      throw new BadRequestException('amountRp harus integer > 0');
    }
    if (!user?.id || !user?.branchId) {
      throw new BadRequestException('Invalid user context');
    }

    const paidAt = input.paidAt ?? new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        `SELECT id FROM "Loan" WHERE id = $1 FOR UPDATE`,
        loanId,
      );

      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: {
          id: true,
          code: true,
          status: true,
          principalRp: true,
          startDate: true,
          branchId: true,
          finalizedAt: true,
        },
      });

      if (!loan) throw new NotFoundException('Loan tidak ditemukan');

      if (loan.status === LoanStatus.CLOSED) {
        throw new BadRequestException('Loan sudah ditutup');
      }

      if (loan.branchId !== user.branchId) {
        throw new BadRequestException('Loan bukan milik cabang ini');
      }

      // Optional: kalau sudah LUNAS, jangan terima payment lagi (lebih aman)
      if (loan.status === LoanStatus.LUNAS) {
        throw new BadRequestException('Loan sudah lunas');
      }

      // 2) hitung kewajiban via calculator (single source for interest/status)
      const summary = this.calculator.calculate({
        principalRp: loan.principalRp,
        startDate: loan.startDate,
        today: paidAt,
      });

      // 3) sync status loan kalau perlu (ACTIVE <-> OVERDUE) sebelum keputusan LUNAS
      if (summary.status !== loan.status) {
        await tx.loan.update({
          where: { id: loanId },
          data: { status: summary.status },
        });
      }

      // 4) agregasi pembayaran sebelumnya (yang sudah tercatat)
      const agg = await tx.payment.aggregate({
        where: { loanId },
        _sum: {
          interestRecordedRp: true,
          principalRecordedRp: true,
        },
      });

      const interestPaidSoFar = agg._sum.interestRecordedRp ?? 0;
      const principalPaidSoFar = agg._sum.principalRecordedRp ?? 0;
      const totalPaidSoFar = interestPaidSoFar + principalPaidSoFar;

      // 5) remaining berdasarkan kewajiban saat ini
      const remainingTotal = Math.max(summary.totalDueRp - totalPaidSoFar, 0);
      if (remainingTotal <= 0) {
        // safety net: kalau data sudah lunas tapi status belum keburu update
        await tx.loan.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.LUNAS,
            finalizedAt: loan.finalizedAt ?? paidAt,
            daysUsedFinal: summary.daysUsed,
            interestRateBpsFinal: summary.interestRatePercent * 100,
            interestAmountRpFinal: summary.interestAmountRp,
            totalDueRpFinal: summary.totalDueRp,
          },
        });
        throw new BadRequestException('Loan sudah lunas');
      }

      // 6) anti-overpay (pilih strategi: tolak atau auto-cap)
      // Strategi paling audit-friendly: TOLAK overpay.
      if (input.amountRp > remainingTotal) {
        throw new BadRequestException(
          `Pembayaran melebihi sisa kewajiban. Maksimal ${remainingTotal}`,
        );
      }

      // 7) alokasi bunga dulu
      const remainingInterest = Math.max(
        summary.interestAmountRp - interestPaidSoFar,
        0,
      );
      const interestRecordedRp = Math.min(input.amountRp, remainingInterest);
      const principalRecordedRp = input.amountRp - interestRecordedRp;

      // 8) simpan payment snapshot (immutable)
      const payment = await tx.payment.create({
        data: {
          loanId,
          userId: user.id,
          branchId: user.branchId,

          amountRp: input.amountRp,
          paidAt,
          note: input.note,

          daysUsedSnapshot: summary.daysUsed,
          interestRateSnapshotBps: summary.interestRatePercent * 100,
          interestAmountSnapshotRp: summary.interestAmountRp,
          totalDueSnapshotRp: summary.totalDueRp,

          interestRecordedRp,
          principalRecordedRp,
        },
      });

      const ledger = await tx.cashLedger.create({
        data: {
          branchId: user.branchId,
          userId: user.id,
          type: CashType.IN,
          source: CashSource.PAYMENT,
          amountRp: input.amountRp,
          title: `Pembayaran Gadai ${loan.code ?? loanId}`,
          note: `Otomatis dari pembayaran ${payment.id}`,
          txnDate: paidAt,

          status: CashStatus.POSTED,
          category: CashCategory.OPERATIONAL,

          paymentId: payment.id, // 🔥 INI KUNCI REVERSAL
        },
      });

      // 9) cek lunas setelah payment ini
      const totalRecordedAfter = totalPaidSoFar + input.amountRp;

      if (totalRecordedAfter >= summary.totalDueRp) {
        await tx.loan.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.LUNAS,
            finalizedAt: paidAt,
            daysUsedFinal: summary.daysUsed,
            interestRateBpsFinal: summary.interestRatePercent * 100,
            interestAmountRpFinal: summary.interestAmountRp,
            totalDueRpFinal: summary.totalDueRp,
          },
        });
      }

      return {
        ledgerId: ledger.id,
        paymentId: payment.id,
        paidAt: payment.paidAt,
        amountRp: payment.amountRp,
        allocation: {
          interestRecordedRp,
          principalRecordedRp,
        },
        meta: {
          loanStatusAfter:
            totalRecordedAfter >= summary.totalDueRp
              ? LoanStatus.LUNAS
              : summary.status,
          remainingAfter: Math.max(summary.totalDueRp - totalRecordedAfter, 0),
        },
      };
    });
  }

  async listPayments(loanId: string) {
    return this.prisma.payment.findMany({
      where: { loanId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reversePayment(
    paymentId: string,
    reason: string,
    user: { id: string; branchId: string },
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('Alasan reversal wajib diisi');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { cashLedger: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment tidak ditemukan');
      }

      if (payment.reversedAt) {
        throw new BadRequestException('Payment sudah direversal');
      }

      if (!payment.cashLedger) {
        throw new NotFoundException('Cash ledger payment tidak ditemukan');
      }

      const ledger = payment.cashLedger;

      if (ledger.status === CashStatus.REVERSED) {
        throw new BadRequestException('Ledger sudah direversal');
      }

      if (ledger.branchId !== user.branchId) {
        throw new BadRequestException('Bukan cabang ini');
      }

      const now = new Date();

      // 1️⃣ Buat ledger OUT (counter-entry)
      const reversalLedger = await tx.cashLedger.create({
        data: {
          branchId: ledger.branchId,
          userId: user.id,

          type: CashType.OUT,
          source: CashSource.MANUAL,
          amountRp: ledger.amountRp,
          title: `Pembatalan Pembayaran ${payment.id}`,
          note: reason,

          txnDate: now,
          status: CashStatus.POSTED,
          category: CashCategory.OPERATIONAL,

          reversalOfId: ledger.id,
        },
      });

      // 2️⃣ Tandai ledger lama
      await tx.cashLedger.update({
        where: { id: ledger.id },
        data: {
          status: CashStatus.REVERSED,
          reversedAt: now,
          reversedById: reversalLedger.id,
        },
      });

      // 3️⃣ Tandai payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          reversedAt: now,
          reversedBy: user.id,
        },
      });

      return {
        paymentId: payment.id,
        reversalLedgerId: reversalLedger.id,
        amountRp: ledger.amountRp,
      };
    });
  }
}
