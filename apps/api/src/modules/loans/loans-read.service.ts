import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

/**
 * READ MODEL SERVICE
 * ==================
 * - TIDAK BOLEH write ke DB
 * - TIDAK BOLEH kalkulasi runtime (calculator)
 * - HANYA stored facts + clearly labeled derived
 * - Audit-grade
 */

export type TimelineEventType =
  | 'LOAN_CREATED'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_FINALIZED'
  | 'CONTRACT_VOIDED'
  | 'DECISION_ADDED'
  | 'AUCTION_LISTED'
  | 'AUCTION_CLOSED'
  | 'AUCTION_SETTLED';

export interface TimelineEvent {
  at: Date;
  type: TimelineEventType;
  actor: { id: string; name: string } | null;
  ref: {
    loanId: string;
    contractId?: string;
    decisionId?: string;
    auctionId?: string;
    settlementId?: string;
    cashLedgerId?: string;
  };
  data: Record<string, any>;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function findEvent(
  timeline: TimelineEvent[],
  type: TimelineEventType,
): TimelineEvent | undefined {
  return timeline.find((e) => e.type === type);
}

@Injectable()
export class LoanReadService {
  constructor(private readonly prisma: PrismaService) {}

  async getLoanTimeline(
    loanId: string,
    user: { branchId: string },
  ): Promise<{
    loan: any;
    derived: any;
    timeline: TimelineEvent[];
    auditChecks: { ok: boolean; warnings: string[] };
  }> {
    /**
     * 1️⃣ LOAD DATA (SINGLE QUERY, ASC ORDER)
     */
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        branch: true,
        createdBy: { select: { id: true, fullName: true } },

        decisions: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },

        LoanContract: {
          orderBy: { createdAt: 'asc' },
          include: {
            createdBy: { select: { id: true, fullName: true } },
            finalizedBy: { select: { id: true, fullName: true } },
            voidedBy: { select: { id: true, fullName: true } },
          },
        },

        auction: {
          include: {
            createdBy: { select: { id: true, fullName: true } },
            closedBy: { select: { id: true, fullName: true } },

            AuctionSettlement: {
              orderBy: { settledAt: 'asc' },
              include: {
                createdBy: { select: { id: true, fullName: true } },
                cashLedger: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan tidak ditemukan');
    }

    if (loan.branchId !== user.branchId) {
      throw new ForbiddenException('Loan bukan milik cabang ini');
    }

    /**
     * 2️⃣ BUILD TIMELINE (FACTS ONLY)
     */
    const timeline: TimelineEvent[] = [];

    // LOAN CREATED
    timeline.push({
      at: toDate(loan.createdAt),
      type: 'LOAN_CREATED',
      actor: loan.createdBy
        ? { id: loan.createdBy.id, name: loan.createdBy.fullName }
        : null,
      ref: { loanId: loan.id },
      data: {
        code: loan.code,
        principalRp: loan.principalRp,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
      },
    });

    // CONTRACT EVENTS
    for (const c of loan.LoanContract) {
      timeline.push({
        at: c.createdAt,
        type: 'CONTRACT_CREATED',
        actor: c.createdBy
          ? { id: c.createdBy.id, name: c.createdBy.fullName }
          : null,
        ref: { loanId: loan.id, contractId: c.id },
        data: {
          status: c.status,
          templateVersion: c.templateVersion,
          snapshotHash: c.snapshotHashSha256,
        },
      });

      if (toDate(c.finalizedAt)) {
        timeline.push({
          at: toDate(c.finalizedAt),
          type: 'CONTRACT_FINALIZED',
          actor: c.finalizedBy
            ? { id: c.finalizedBy.id, name: c.finalizedBy.fullName }
            : null,
          ref: { loanId: loan.id, contractId: c.id },
          data: {},
        });
      }

      if (c.voidedAt) {
        timeline.push({
          at: c.voidedAt,
          type: 'CONTRACT_VOIDED',
          actor: c.voidedBy
            ? { id: c.voidedBy.id, name: c.voidedBy.fullName }
            : null,
          ref: { loanId: loan.id, contractId: c.id },
          data: { reason: c.voidReason },
        });
      }
    }

    // DECISIONS
    for (const d of loan.decisions) {
      timeline.push({
        at: d.createdAt,
        type: 'DECISION_ADDED',
        actor: { id: d.user.id, name: d.user.fullName },
        ref: { loanId: loan.id, decisionId: d.id },
        data: {
          decision: d.decision,
          note: d.note,
        },
      });
    }

    // AUCTION + SETTLEMENT
    if (loan.auction) {
      const a = loan.auction;

      timeline.push({
        at: a.listedAt,
        type: 'AUCTION_LISTED',
        actor: a.createdBy
          ? { id: a.createdBy.id, name: a.createdBy.fullName }
          : null,
        ref: { loanId: loan.id, auctionId: a.id },
        data: {
          totalDueSnapshotRp: a.totalDueSnapshotRp,
          remainingSnapshotRp: a.remainingSnapshotRp,
        },
      });

      if (a.closedAt) {
        timeline.push({
          at: a.closedAt,
          type: 'AUCTION_CLOSED',
          actor: a.closedBy
            ? { id: a.closedBy.id, name: a.closedBy.fullName }
            : null,
          ref: { loanId: loan.id, auctionId: a.id },
          data: {
            status: a.status,
            note: a.note,
          },
        });
      }

      for (const s of a.AuctionSettlement) {
        timeline.push({
          at: toDate(s.settledAt),
          type: 'AUCTION_SETTLED',
          actor: s.createdBy
            ? { id: s.createdBy.id, name: s.createdBy.fullName }
            : null,
          ref: {
            loanId: loan.id,
            auctionId: a.id,
            settlementId: s.id,
            cashLedgerId: s.cashLedger?.id,
          },
          data: {
            grossAmountRp: s.grossAmountRp,
            feesRp: s.feesRp,
            netAmountRp: s.netAmountRp,
            cashLedger: s.cashLedger
              ? {
                  type: s.cashLedger.type,
                  source: s.cashLedger.source,
                  amountRp: s.cashLedger.amountRp,
                  txnDate: s.cashLedger.txnDate,
                }
              : null,
          },
        });
      }
    }

    // FINAL SORT (DEFENSIVE)
    timeline.sort((a, b) => {
      const t1 = a.at.getTime();
      const t2 = b.at.getTime();

      if (t1 !== t2) return t1 - t2;

      // tie-breaker supaya deterministik
      return a.type.localeCompare(b.type);
    });

    /**
     * 3️⃣ AUDIT CHECKS (READ-ONLY VALIDATION)
     */
    const warnings: string[] = [];

    // === CHRONOLOGY AUDIT CHECKS ===

    const contractCreated = findEvent(timeline, 'CONTRACT_CREATED');
    const contractFinalized = findEvent(timeline, 'CONTRACT_FINALIZED');

    if (
      contractCreated &&
      contractFinalized &&
      contractFinalized.at < contractCreated.at
    ) {
      warnings.push(
        'Chronology violation: CONTRACT_FINALIZED occurs before CONTRACT_CREATED',
      );
    }

    const auctionListed = findEvent(timeline, 'AUCTION_LISTED');
    const auctionClosed = findEvent(timeline, 'AUCTION_CLOSED');
    const auctionSettled = findEvent(timeline, 'AUCTION_SETTLED');

    if (
      auctionSettled &&
      auctionListed &&
      auctionSettled.at < auctionListed.at
    ) {
      warnings.push(
        'Chronology violation: AUCTION_SETTLED occurs before AUCTION_LISTED',
      );
    }

    if (
      auctionSettled &&
      auctionClosed &&
      auctionSettled.at < auctionClosed.at
    ) {
      warnings.push(
        'Chronology violation: AUCTION_SETTLED occurs before AUCTION_CLOSED',
      );
    }

    if (loan.auction?.status === 'SOLD' && loan.status !== LoanStatus.CLOSED) {
      warnings.push(
        'Invariant mismatch: auction SOLD tetapi loan.status belum CLOSED',
      );
    }

    for (const s of loan.auction?.AuctionSettlement ?? []) {
      if (s.cashLedger?.source !== 'AUCTION') {
        warnings.push(`CashLedger source invalid untuk settlement ${s.id}`);
      }

      if (s.cashLedger?.type !== 'IN') {
        warnings.push(`CashLedger type invalid untuk settlement ${s.id}`);
      }
    }

    if ((loan.auction?.AuctionSettlement.length ?? 0) > 1) {
      warnings.push(
        'Multiple auction settlements terdeteksi (pastikan ini intended)',
      );
    }

    /**
     * 4️⃣ RETURN READ MODEL
     */
    return {
      loan: {
        id: loan.id,
        code: loan.code,
        status: loan.status,
        customer: loan.customer,
        branch: loan.branch,
        createdAt: toDate(loan.createdAt),
      },

      derived: {
        overdueAt: loan.dueDate,
      },

      timeline,

      auditChecks: {
        ok: warnings.length === 0,
        warnings,
      },
    };
  }
}
