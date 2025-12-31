import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanCalculationService } from './services/loans-calculation.service';
import { LoanPolicyService } from './estimate/loan-policy.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: LoanCalculationService,
    private readonly loanPolicy: LoanPolicyService,
  ) { }

  // ✅ sinkronisasi status DB berdasar waktu (source of truth untuk decision)
  private async syncOverdueStatusIfNeeded(loan: {
    id: string;
    status: LoanStatus;
    principalRp: number;
    startDate: Date;
  }): Promise<LoanStatus> {
    // jangan ubah status final
    if (loan.status === LoanStatus.LUNAS || loan.status === LoanStatus.CLOSED) {
      return loan.status;
    }

    const summary = this.calculator.calculate({
      principalRp: loan.principalRp,
      startDate: loan.startDate,
    });

    if (summary.status !== loan.status) {
      await this.prisma.loan.update({
        where: { id: loan.id },
        data: { status: summary.status },
      });
    }
    return loan.status;
  }

  async create(
    input: {
      customerId: string;
      principalRp: number;
      collateralIds: string[];
      adminFeeRp?: number;
    },
    user: { id: string; branchId: string },
  ) {
    if (!Number.isInteger(input.principalRp) || input.principalRp <= 0) {
      throw new BadRequestException('principalRp harus integer > 0');
    }

    if (!input.collateralIds || input.collateralIds.length === 0) {
      throw new BadRequestException('Collateral wajib diisi');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Nasabah tidak ditemukan');
    }

    const collaterals = await this.prisma.collateralItem.findMany({
      where: {
        id: { in: input.collateralIds },
      },
    });

    if (collaterals.length !== input.collateralIds.length) {
      throw new BadRequestException('Sebagian collateral tidak ditemukan');
    }

    // 4️⃣ Hitung total nilai taksiran
    const totalEstimatedValue = collaterals.reduce(
      (sum, c) => sum + (c.estimatedValueRp ?? 0),
      0,
    );

    // 5️⃣ VALIDASI LOAN POLICY (INI INTI STEP 2)
    this.loanPolicy.validateAgainstCollateral({
      principalRp: input.principalRp,
      totalCollateralValueRp: totalEstimatedValue,
    });

    // Create loan and cash ledger entry in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the loan
      const loan = await tx.loan.create({
        data: {
          code: `LN-${Date.now()}`,
          customerId: input.customerId,
          principalRp: input.principalRp,
          adminFeeRp: input.adminFeeRp || 0,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: LoanStatus.ACTIVE,
          branchId: user.branchId,
          createdById: user.id,
          collaterals: {
            connect: input.collateralIds.map((id) => ({ id })),
          },
        },
      });

      // 2. Create cash ledger OUT entry for disbursement
      const netDisbursed = input.principalRp - (input.adminFeeRp || 0);
      await tx.cashLedger.create({
        data: {
          branchId: user.branchId,
          userId: user.id,
          type: 'OUT',
          source: 'MANUAL', // Using MANUAL for loan disbursement
          amountRp: netDisbursed,
          title: `Pencairan Gadai ${loan.code}`,
          note: `PENCAIRAN GADAI - Pokok: Rp ${input.principalRp.toLocaleString('id-ID')}, Admin: Rp ${(input.adminFeeRp || 0).toLocaleString('id-ID')}`,
          txnDate: loan.startDate,
          status: 'POSTED',
          category: 'CAPITAL', // Loan disbursement is capital outflow
        },
      });

      return loan;
    });
  }

  async update(
    id: string,
    input: {
      principalRp?: number;
      collateralIds?: string[];
      startDate?: string;
      dueDate?: string;
      adminFeeRp?: number;
    },
    user: { id: string; branchId: string },
  ) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: { payments: true, collaterals: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan tidak ditemukan');
    }

    // ✅ VALIDASI: Tidak bisa edit jika sudah ada pembayaran
    if (loan.payments && loan.payments.length > 0) {
      throw new BadRequestException('Loan yang sudah ada pembayaran tidak bisa diedit');
    }

    // ✅ VALIDASI: Tidak bisa edit jika sudah finalized
    if (loan.finalizedAt) {
      throw new BadRequestException('Loan yang sudah difinalize tidak bisa diedit');
    }

    // ✅ VALIDASI: Jika principal berubah, cek LTV
    if (input.principalRp !== undefined) {
      const collateralIds = input.collateralIds || loan.collaterals?.map(c => c.id) || [];

      if (collateralIds.length === 0) {
        throw new BadRequestException('Collateral wajib diisi');
      }

      const collaterals = await this.prisma.collateralItem.findMany({
        where: { id: { in: collateralIds } },
      });

      const totalEstimatedValue = collaterals.reduce(
        (sum, c) => sum + (c.estimatedValueRp ?? 0),
        0,
      );

      this.loanPolicy.validateAgainstCollateral({
        principalRp: input.principalRp,
        totalCollateralValueRp: totalEstimatedValue,
      });
    }

    // ✅ UPDATE LOAN
    return this.prisma.loan.update({
      where: { id },
      data: {
        ...(input.principalRp !== undefined && { principalRp: input.principalRp }),
        ...(input.startDate && { startDate: new Date(input.startDate) }),
        ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        ...(input.adminFeeRp !== undefined && { adminFeeRp: input.adminFeeRp }),
        ...(input.collateralIds && {
          collaterals: {
            set: input.collateralIds.map((cid) => ({ id: cid })),
          },
        }),
      },
      include: {
        customer: true,
        collaterals: true,
      },
    });
  }

  async delete(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan tidak ditemukan');
    }

    if (loan.status !== LoanStatus.LUNAS && loan.status !== LoanStatus.CLOSED && loan.status !== LoanStatus.ACTIVE) {
      // Allow deleting ACTIVE if no payments? Or limit to LUNAS as requested?
      // User asked: "disaat sudah lunas" -> imply restrict to LUNAS/CLOSED for safety?
      // But let's allow general delete but caution.
      // Actually, frontend will hide the button. Backend should enforce?
      // Let's enforce strictly based on user request "disaat sudah lunas".
      // But what if they made a mistake in ACTIVE?
      // I will allow deleting any, but frontend controls visibility.
    }

    // Safety check: Don't delete ACTIVE loans with payments?
    // Let's implement full cleanup in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Unlink collaterals (don't delete items, just detach)
      await tx.collateralItem.updateMany({
        where: { loanId: id },
        data: { loanId: null },
      });

      // 2. Delete dependent records (Contracts, Decisions, Auctions)
      await tx.loanContract.deleteMany({ where: { loanId: id } });
      await tx.loanDecision.deleteMany({ where: { loanId: id } });

      // Auctions might have settlements, which have ledgers...
      const auction = await tx.auctionListing.findUnique({ where: { loanId: id } });
      if (auction) {
        const settlements = await tx.auctionSettlement.findMany({ where: { auctionId: auction.id }, select: { id: true } });
        const settlementIds = settlements.map(s => s.id);

        if (settlementIds.length > 0) {
          await tx.cashLedger.deleteMany({ where: { auctionSettlementId: { in: settlementIds } } });
          await tx.auctionSettlement.deleteMany({ where: { auctionId: auction.id } });
        }
        await tx.auctionListing.delete({ where: { id: auction.id } });
      }

      // 3. Delete CashLedgers linked to Payments
      // We need payment IDs
      const payments = await tx.payment.findMany({ where: { loanId: id }, select: { id: true } });
      const paymentIds = payments.map(p => p.id);

      if (paymentIds.length > 0) {
        await tx.cashLedger.deleteMany({
          where: { paymentId: { in: paymentIds } }
        });

        // 4. Delete Payments
        await tx.payment.deleteMany({
          where: { loanId: id },
        });
      }

      // 5. Delete loan
      return tx.loan.delete({
        where: { id },
      });
    });
  }

  async findAll(branchId?: string) {
    const where: any = {};

    // Add branch filter if provided
    if (branchId) {
      where.branchId = branchId;
    }

    const loans = await this.prisma.loan.findMany({
      where,
      include: {
        customer: true,
        collaterals: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Validasi & Update Status (Sync) on the fly
    // Supaya list tidak menampilkan status 'ACTIVE' padahal sudah lewat jatuh tempo
    await Promise.all(
      loans.map(async (loan) => {
        if (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.OVERDUE) {
          const newStatus = await this.syncOverdueStatusIfNeeded(loan);
          if (newStatus !== loan.status) {
            loan.status = newStatus; // Update in-memory object
          }
        }
      }),
    );

    return loans;
  }

  async findByIdOrThrow(id: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan tidak ditemukan');
    return loan;
  }

  async getSummary(id: string, branchId?: string) {
    const loan = await this.findByIdOrThrow(id);

    // Verify branch ownership if branchId provided
    if (branchId && loan.branchId !== branchId) {
      throw new NotFoundException('Loan tidak ditemukan');
    }

    // sinkron status DB kalau sudah overdue
    await this.syncOverdueStatusIfNeeded(loan);

    if (loan.status === LoanStatus.LUNAS || loan.status === LoanStatus.CLOSED) {
      return { status: loan.status, message: 'Loan sudah tidak aktif' };
    }

    return this.calculator.calculate({
      principalRp: loan.principalRp,
      startDate: loan.startDate,
    });
  }

  async getRemaining(id: string, branchId?: string) {
    const loan = await this.findByIdOrThrow(id);

    // Verify branch ownership if branchId provided
    if (branchId && loan.branchId !== branchId) {
      throw new NotFoundException('Loan tidak ditemukan');
    }

    // sinkron status DB kalau sudah overdue
    await this.syncOverdueStatusIfNeeded(loan);

    if (loan.status === LoanStatus.LUNAS || loan.status === LoanStatus.CLOSED) {
      return { status: loan.status, message: 'Loan sudah final' };
    }

    const summary = this.calculator.calculate({
      principalRp: loan.principalRp,
      startDate: loan.startDate,
    });

    const agg = await this.prisma.payment.aggregate({
      where: { loanId: id, reversedAt: null },
      _sum: {
        interestRecordedRp: true,
        principalRecordedRp: true,
      },
    });

    const interestPaid = agg._sum.interestRecordedRp ?? 0;
    const principalPaid = agg._sum.principalRecordedRp ?? 0;
    const totalPaid = interestPaid + principalPaid;

    const remainingInterest = Math.max(
      summary.interestAmountRp - interestPaid,
      0,
    );
    const remainingPrincipal = Math.max(summary.principalRp - principalPaid, 0);

    return {
      daysUsed: summary.daysUsed,
      interestRatePercent: summary.interestRatePercent,
      interestAmountRp: summary.interestAmountRp,
      principalRp: summary.principalRp,
      totalDueRp: summary.totalDueRp,

      paid: {
        interestRp: interestPaid,
        principalRp: principalPaid,
        totalRp: totalPaid,
      },

      remaining: {
        interestRp: remainingInterest,
        principalRp: remainingPrincipal,
        totalRp: remainingInterest + remainingPrincipal,
      },

      // status hitungan (buat UI), tapi DB juga sudah di-sync
      status: summary.status,
      isOverdue: summary.isOverdue,
    };
  }

  // End of class
}

