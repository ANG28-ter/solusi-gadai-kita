import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CashType, CashSource } from '@prisma/client';
import { LoanCalculationService } from '../loans/services/loans-calculation.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: LoanCalculationService,
  ) { }

  async createPayment(params: {
    loanId: string;
    branchId: string;
    userId: string;
    amountRp: number;
    paidAt: Date;
    note?: string;
  }) {
    if (params.amountRp <= 0) {
      throw new ForbiddenException('Payment amount must be greater than zero');
    }

    // 1. Fetch Loan details needed for calculation
    const loan = await this.prisma.loan.findUnique({
      where: { id: params.loanId },
      select: { branchId: true, principalRp: true, startDate: true },
    });

    if (!loan) {
      throw new ForbiddenException('Loan not found');
    }

    // NOTE: We force the payment to belong to the SAME branch as the Loan.
    const targetBranchId = loan.branchId;

    // 2. Calculate current status & pending amounts
    const calculation = this.calculator.calculate({
      principalRp: loan.principalRp,
      startDate: loan.startDate,
      today: params.paidAt, // Use payment date for calculation consistency
    });

    // 3. Get existing paid amounts
    const paidAgg = await this.prisma.payment.aggregate({
      where: { loanId: params.loanId, reversedAt: null },
      _sum: { interestRecordedRp: true, principalRecordedRp: true }
    });
    const interestPaidSoFar = paidAgg._sum.interestRecordedRp ?? 0;

    // 4. Determine Allocation (Priority: Interest -> Principal)
    const remainingInterest = Math.max(calculation.interestAmountRp - interestPaidSoFar, 0);

    let interestRecordedRp = 0;
    let principalRecordedRp = 0;

    if (params.amountRp <= remainingInterest) {
      interestRecordedRp = params.amountRp;
    } else {
      interestRecordedRp = remainingInterest;
      principalRecordedRp = params.amountRp - remainingInterest;
    }

    return this.prisma.$transaction(async (tx) => {
      /**
       * 1️⃣ CREATE PAYMENT (ADMINISTRATIVE)
       */
      const payment = await tx.payment.create({
        data: {
          amountRp: params.amountRp,
          paidAt: params.paidAt,
          note: params.note,

          interestRecordedRp,
          principalRecordedRp,

          // Snapshot for audit
          daysUsedSnapshot: calculation.daysUsed,
          interestRateSnapshotBps: calculation.interestRatePercent * 100,
          interestAmountSnapshotRp: calculation.interestAmountRp,
          totalDueSnapshotRp: calculation.totalDueRp,

          loan: {
            connect: { id: params.loanId },
          },
          user: {
            connect: { id: params.userId },
          },
          branch: {
            connect: { id: targetBranchId },
          },
        },
      });

      /**
       * 2️⃣ CREATE CASH LEDGER (AUTOMATIC)
       * SOURCE = PAYMENT
       */
      await tx.cashLedger.create({
        data: {
          branchId: targetBranchId, // ⬅️ USE LOAN'S BRANCH
          userId: params.userId,
          type: CashType.IN,
          source: CashSource.PAYMENT,
          amountRp: params.amountRp,
          title: `Payment Loan ${params.loanId}`,
          note: `Auto from payment ${payment.id}`,
          txnDate: params.paidAt,
          paymentId: payment.id, // ⬅️ LINK TO PAYMENT
        },
      });

      /**
       * 3️⃣ CHECK IF LOAN IS FULLY PAID & UPDATE STATUS TO LUNAS
       */
      // Calculate total paid (including this payment)
      const totalPaidAgg = await tx.payment.aggregate({
        where: { loanId: params.loanId, reversedAt: null },
        _sum: { interestRecordedRp: true, principalRecordedRp: true }
      });

      const totalInterestPaid = totalPaidAgg._sum.interestRecordedRp ?? 0;
      const totalPrincipalPaid = totalPaidAgg._sum.principalRecordedRp ?? 0;
      const totalPaid = totalInterestPaid + totalPrincipalPaid;

      // If fully paid, update loan status to LUNAS
      if (totalPaid >= calculation.totalDueRp) {
        await tx.loan.update({
          where: { id: params.loanId },
          data: {
            status: 'LUNAS',
            finalizedAt: params.paidAt,
            daysUsedFinal: calculation.daysUsed,
            interestRateBpsFinal: calculation.interestRatePercent * 100,
            interestAmountRpFinal: calculation.interestAmountRp,
            totalDueRpFinal: calculation.totalDueRp,
          },
        });
      }

      return payment;
    });
  }
  async findById(id: string, branchId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        loan: {
          select: {
            id: true,
            code: true,
            customer: { select: { fullName: true, address: true } },
          },
        },
        branch: { select: { name: true, address: true, phone: true } },
        user: { select: { fullName: true, username: true } },
        cashLedger: true,
      },
    });

    if (!payment) {
      throw new ForbiddenException('Payment not found');
    }

    if (payment.branchId !== branchId) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }

  async findAll(params: { branchId: string; loanId?: string; page?: number; limit?: number }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = { branchId: params.branchId };
    if (params.loanId) {
      where.loanId = params.loanId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          loan: { select: { code: true, customer: { select: { fullName: true } } } },
          user: { select: { fullName: true } },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reversePayment(id: string, userId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { cashLedger: true },
    });

    if (!payment) {
      throw new ForbiddenException('Payment not found');
    }

    if (payment.reversedAt) {
      throw new ForbiddenException('Payment already reversed');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark Payment as Reversed
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          reversedAt: new Date(),
          reversedBy: userId,
          note: payment.note ? `${payment.note} | Reversed: ${reason}` : `Reversed: ${reason}`,
        },
      });

      // 2. Mark CashLedger as REVERSED (voiding the cash in)
      if (payment.cashLedger) {
        await tx.cashLedger.update({
          where: { id: payment.cashLedger.id },
          data: { status: 'REVERSED' },
        });
      }

      // 3. Revert loan status if it was LUNAS
      const loan = await tx.loan.findUnique({
        where: { id: payment.loanId },
        select: { id: true, status: true, principalRp: true, startDate: true },
      });

      if (loan && loan.status === 'LUNAS') {
        // Recalculate what the status should be
        const calculation = this.calculator.calculate({
          principalRp: loan.principalRp,
          startDate: loan.startDate,
        });

        // Check remaining payments after reversal
        const totalPaidAgg = await tx.payment.aggregate({
          where: { loanId: payment.loanId, reversedAt: null },
          _sum: { interestRecordedRp: true, principalRecordedRp: true }
        });

        const totalPaid = (totalPaidAgg._sum.interestRecordedRp ?? 0) + (totalPaidAgg._sum.principalRecordedRp ?? 0);

        // If no longer fully paid, revert to calculated status and clear finalization
        if (totalPaid < calculation.totalDueRp) {
          await tx.loan.update({
            where: { id: loan.id },
            data: {
              status: calculation.status, // Will be ACTIVE or OVERDUE based on date
              finalizedAt: null,
              daysUsedFinal: null,
              interestRateBpsFinal: null,
              interestAmountRpFinal: null,
              totalDueRpFinal: null,
            },
          });
        }
      }

      return updatedPayment;
    });
  }

}
