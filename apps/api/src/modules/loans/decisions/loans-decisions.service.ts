import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLoanDecisionDto } from './dto/create-loan-decision.dto';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoanDecisionsService {
  constructor(private readonly prisma: PrismaService) { }

  async createDecision(
    loanId: string,
    dto: CreateLoanDecisionDto,
    user: { id: string; branchId: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // lock row loan biar keputusan tidak race (optional tapi bagus)
      await tx.$queryRawUnsafe(
        `SELECT id FROM "Loan" WHERE id = $1 FOR UPDATE`,
        loanId,
      );

      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: { id: true, status: true, branchId: true },
      });

      if (!loan) throw new NotFoundException('Pinjaman tidak ditemukan');

      // Optional: enforce branch match (lebih aman)
      if (loan.branchId !== user.branchId) {
        throw new ForbiddenException('Pinjaman bukan milik cabang ini');
      }

      if (loan.status === LoanStatus.CLOSED) {
        throw new BadRequestException('Pinjaman sudah ditutup');
      }

      // Guard utama: hanya overdue
      if (loan.status !== LoanStatus.OVERDUE) {
        throw new BadRequestException(
          'Keputusan hanya boleh dibuat untuk status jatuh tempo',
        );
      }

      // Safety: loan lunas/closed tidak boleh (meski harusnya tidak mungkin)
      if (loan.status !== LoanStatus.OVERDUE) {
        throw new BadRequestException(
          'Keputusan hanya boleh dibuat untuk status jatuh tempo',
        );
      }
      // (Opsional) Anti spam: kalau decision terakhir sama persis, tolak
      const last = await tx.loanDecision.findFirst({
        where: { loanId },
        orderBy: { createdAt: 'desc' },
        select: { decision: true },
      });

      if (last?.decision === dto.decision) {
        throw new BadRequestException(
          `Keputusan terakhir sudah ${dto.decision}, tidak perlu mengulang`,
        );
      }

      const decision = await tx.loanDecision.create({
        data: {
          loanId,
          userId: user.id,
          decision: dto.decision,
          note: dto.note?.trim() || null,
        },
      });

      return {
        id: decision.id,
        loanId: decision.loanId,
        decision: decision.decision,
        note: decision.note,
        decidedAt: decision.createdAt,
        decidedByUserId: decision.userId,
      };
    });
  }

  async listDecisions(loanId: string, user: { branchId: string }) {
    // Kalau mau strict: cek loan branch dulu, biar cabang lain gak bisa lihat
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      select: { id: true, branchId: true },
    });
    if (!loan) throw new NotFoundException('Pinjaman tidak ditemukan');
    if (loan.branchId !== user.branchId) {
      throw new ForbiddenException('Pinjaman bukan milik cabang ini');
    }

    const rows = await this.prisma.loanDecision.findMany({
      where: { loanId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    return rows.map((d) => ({
      id: d.id,
      decision: d.decision,
      note: d.note,
      decidedAt: d.createdAt,
      decidedBy: d.user?.fullName ?? d.userId,
    }));
  }
}
