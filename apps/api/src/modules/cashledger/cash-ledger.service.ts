import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CashType, CashSource, CashCategory } from '@prisma/client';

@Injectable()
export class CashLedgerService {
  constructor(private readonly prisma: PrismaService) { }

  async createManual(params: {
    branchId: string;
    userId: string;
    type: CashType;
    amountRp: number;
    title: string;
    note?: string;
    txnDate: Date;
    category?: CashCategory;
  }) {
    // Validation
    if (!['IN', 'OUT'].includes(params.type)) {
      throw new ForbiddenException('Type harus IN atau OUT');
    }

    if (params.amountRp <= 0 || !Number.isInteger(params.amountRp)) {
      throw new ForbiddenException('Amount harus integer > 0');
    }

    if (!params.title || params.title.trim().length < 3) {
      throw new ForbiddenException('Title minimal 3 karakter');
    }

    return this.prisma.cashLedger.create({
      data: {
        branch: { connect: { id: params.branchId } },
        user: { connect: { id: params.userId } },
        type: params.type,
        source: CashSource.MANUAL,
        amountRp: params.amountRp,
        title: params.title,
        note: params.note,
        txnDate: params.txnDate,
        status: 'POSTED',
        category: params.category || 'OPERATIONAL',
      },
    });
  }

  async reverseEntry(entryId: string, reversedByUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.cashLedger.findUnique({
        where: { id: entryId },
      });

      if (!original) {
        throw new NotFoundException('Cash entry not found');
      }

      if (original.status === 'REVERSED') {
        throw new ForbiddenException('Entry already reversed');
      }

      // 1️⃣ tandai entry lama
      await tx.cashLedger.update({
        where: { id: entryId },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedById: reversedByUserId,
        },
      });

      // 2️⃣ buat entry pembalik
      return tx.cashLedger.create({
        data: {
          branchId: original.branchId,
          userId: reversedByUserId,
          type: original.type === 'IN' ? 'OUT' : 'IN',
          source: original.source,
          amountRp: original.amountRp,
          title: `REVERSAL: ${original.title}`,
          note: `Reversal of ${original.id}`,
          txnDate: new Date(),
          reversalOfId: original.id,
        },
      });
    });
  }

  async findAll(params: {
    branchId: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
    source?: 'MANUAL' | 'SYSTEM';
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      branchId: params.branchId,
      status: { not: 'REVERSED' }, // Exclude reversed entries
    };

    if (params.from || params.to) {
      where.txnDate = {};
      if (params.from) where.txnDate.gte = params.from;
      if (params.to) where.txnDate.lte = params.to;
    }

    if (params.source) {
      if (params.source === 'MANUAL') {
        where.source = CashSource.MANUAL;
      } else if (params.source === 'SYSTEM') {
        where.source = { not: CashSource.MANUAL };
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cashLedger.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },  // Sort by actual action time (when created)
          { txnDate: 'desc' }     // Secondary sort by transaction date
        ],
        skip,
        take: limit,
        include: {
          payment: {
            select: {
              loan: {
                select: { code: true }
              }
            }
          }
        }
      }),
      this.prisma.cashLedger.count({ where }),
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

  async getSummary(params: { branchId: string; from?: Date; to?: Date }) {
    const where: any = {
      branchId: params.branchId,
      status: { not: 'REVERSED' }, // Exclude reversed entries from summary
    };

    if (params.from || params.to) {
      where.txnDate = {};
      if (params.from) where.txnDate.gte = params.from;
      if (params.to) where.txnDate.lte = params.to;
    }

    const result = await this.prisma.cashLedger.groupBy({
      by: ['type'],
      where,
      _sum: {
        amountRp: true,
      },
    });

    const totalIn = result.find((r) => r.type === 'IN')?._sum.amountRp ?? 0;
    const totalOut = result.find((r) => r.type === 'OUT')?._sum.amountRp ?? 0;

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }
}
