import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoanStatus, AuctionStatus } from '@prisma/client';
import { CloseAuctionDto } from './dto/close-auction.dto';
import { LoanCalculationService } from '../services/loans-calculation.service';

@Injectable()
export class AuctionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: LoanCalculationService,
  ) { }

  async listAuctions(status?: AuctionStatus, branchId?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.auctionListing.findMany({
      where,
      include: {
        loan: {
          select: {
            code: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        listedAt: 'desc',
      },
    });
  }

  async createAuction(loanId: string, user: { id: string; branchId: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Lock loan (hindari race)
      await tx.$queryRawUnsafe(
        `SELECT id FROM "Loan" WHERE id = $1 FOR UPDATE`,
        loanId,
      );

      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: {
          id: true,
          status: true,
          branchId: true,
          dueDate: true,
          principalRp: true,
          startDate: true,
        },
      });

      if (!loan) throw new NotFoundException('Loan tidak ditemukan');

      if (loan.branchId !== user.branchId) {
        throw new ForbiddenException('Loan bukan milik cabang ini');
      }

      if (loan.status !== LoanStatus.OVERDUE) {
        throw new BadRequestException(
          'Auction hanya boleh untuk loan status OVERDUE',
        );
      }

      // Pastikan decision terakhir = AUCTION
      const lastDecision = await tx.loanDecision.findFirst({
        where: { loanId },
        orderBy: { createdAt: 'desc' },
        select: { decision: true },
      });

      if (!lastDecision || lastDecision.decision !== 'AUCTION') {
        throw new ForbiddenException(
          'Auction tidak diizinkan tanpa decision AUCTION',
        );
      }

      // Cegah double auction - tapi izinkan re-list jika CANCELLED
      const existingAuction = await tx.auctionListing.findUnique({
        where: { loanId },
      });

      if (existingAuction) {
        // Jika auction sudah LISTED atau SOLD, tidak boleh buat baru
        if (existingAuction.status !== 'CANCELLED') {
          throw new BadRequestException(
            `Auction sudah ada dengan status ${existingAuction.status}`,
          );
        }
        // Jika CANCELLED, akan di-update ke LISTED lagi di bawah
      }

      // Ambil snapshot finansial TERAKHIR (read-only)
      // Ambil snapshot finansial TERAKHIR (read-only)
      const paymentsAgg = await tx.payment.aggregate({
        where: { loanId, reversedAt: null }, // Fix: exclude reversed
        _sum: {
          interestRecordedRp: true,
          principalRecordedRp: true,
        },
      });

      const interestPaid = paymentsAgg._sum.interestRecordedRp ?? 0;
      const principalPaid = paymentsAgg._sum.principalRecordedRp ?? 0;
      const totalPaid = interestPaid + principalPaid;

      // Check logic: isInterestPaidBeforeDay16 same as LoansService
      const day16Start = new Date(loan.startDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const aggEarly = await tx.payment.aggregate({
        where: {
          loanId: loanId,
          reversedAt: null,
          paidAt: { lt: day16Start },
        },
        _sum: { interestRecordedRp: true },
      });
      const interestPaidEarly = aggEarly._sum.interestRecordedRp ?? 0;
      const targetInterest5Percent = Math.floor(loan.principalRp * 0.05);
      const isInterestPaidBeforeDay16 = interestPaidEarly >= targetInterest5Percent;

      // Calculate official stats using calculator
      const summary = this.calculator.calculate({
        principalRp: loan.principalRp,
        startDate: loan.startDate,
        interestPaidSoFar: interestPaid,
        isInterestPaidBeforeDay16,
      });

      // Bunga 10% dari pokok pinjaman -> NO, use calculated amount
      const interestAmountSnapshotRp = summary.interestAmountRp;
      const totalDueSnapshotRp = summary.totalDueRp;

      // Remaining must be calculated correctly (Total Due - Total Paid)
      const remainingSnapshotRp = Math.max(
        summary.totalDueRp - totalPaid,
        0,
      );

      const daysUsedSnapshot = summary.daysUsed;

      let auction;

      // Jika ada auction CANCELLED, update jadi LISTED dengan snapshot baru
      if (existingAuction && existingAuction.status === 'CANCELLED') {
        auction = await tx.auctionListing.update({
          where: { id: existingAuction.id },
          data: {
            status: AuctionStatus.LISTED,
            listedAt: new Date(), // Reset tanggal listed
            closedAt: null, // Reset closed info
            closedById: null,
            note: null, // Clear previous note

            // Update snapshot dengan data terbaru
            dueDateSnapshot: loan.dueDate,
            daysUsedSnapshot,
            interestAmountSnapshotRp,
            totalDueSnapshotRp,
            remainingSnapshotRp,
          },
        });
      } else {
        // Buat baru jika belum ada auction
        auction = await tx.auctionListing.create({
          data: {
            loanId,
            branchId: loan.branchId,
            createdById: user.id,

            status: AuctionStatus.LISTED,

            dueDateSnapshot: loan.dueDate,
            daysUsedSnapshot,
            interestAmountSnapshotRp,
            totalDueSnapshotRp,
            remainingSnapshotRp,
          },
        });
      }

      return {
        auctionId: auction.id,
        loanId: auction.loanId,
        status: auction.status,
        listedAt: auction.listedAt,
        remainingSnapshotRp: auction.remainingSnapshotRp,
      };
    });
  }

  async getAuction(auctionId: string) {
    const auction = await this.prisma.auctionListing.findUnique({
      where: { id: auctionId },
      include: {
        loan: {
          select: {
            code: true,
            principalRp: true,
            customer: {
              select: {
                fullName: true,
                phone: true,
                nik: true,
              },
            },
            collaterals: {
              select: {
                id: true,
                name: true,
                description: true,
                estimatedValueRp: true,
              },
            },
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            fullName: true,
          },
        },
        closedBy: {
          select: {
            fullName: true,
          },
        },
        AuctionSettlement: {
          include: {
            createdBy: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!auction) throw new NotFoundException('Auction tidak ditemukan');

    return auction;
  }

  async closeAuction(
    auctionId: string,
    dto: CloseAuctionDto,
    user: { id: string; branchId: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // lock auction row
      await tx.$queryRawUnsafe(
        `SELECT id FROM "AuctionListing" WHERE id = $1 FOR UPDATE`,
        auctionId,
      );

      const auction = await tx.auctionListing.findUnique({
        where: { id: auctionId },
        select: {
          id: true,
          status: true,
          branchId: true,
          loanId: true,
        },
      });

      if (!auction) {
        throw new NotFoundException('Auction tidak ditemukan');
      }

      if (auction.branchId !== user.branchId) {
        throw new ForbiddenException('Auction bukan milik cabang ini');
      }

      if (auction.status !== 'LISTED') {
        throw new BadRequestException('Auction sudah ditutup');
      }

      if (dto.status === AuctionStatus.SOLD) {
        await tx.loan.update({
          where: { id: auction.loanId },
          data: { status: LoanStatus.CLOSED },
        });
      }

      const closed = await tx.auctionListing.update({
        where: { id: auctionId },
        data: {
          status: dto.status,
          closedAt: new Date(),
          closedById: user.id,
          note: dto.note?.trim() || null,
        },
      });

      return {
        auctionId: closed.id,
        loanId: closed.loanId,
        status: closed.status,
        closedAt: closed.closedAt,
      };
    });
  }
}
