import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  AuctionStatus,
  CashCategory,
  CashSource,
  CashStatus,
  CashType,
} from '@prisma/client';
import { CreateAuctionSettlementDto } from '../dto/create-auctions-settlements.dto';

@Injectable()
export class AuctionSettlementService {
  constructor(private readonly prisma: PrismaService) { }

  async createSettlement(
    auctionId: string,
    dto: CreateAuctionSettlementDto,
    user: { id: string; branchId: string },
  ) {
    const feesRp = dto.feesRp ?? 0;
    const netAmountRp = dto.grossAmountRp - feesRp;

    if (!Number.isInteger(dto.grossAmountRp) || dto.grossAmountRp <= 0) {
      throw new BadRequestException('grossAmountRp harus integer > 0');
    }
    if (!Number.isInteger(feesRp) || feesRp < 0) {
      throw new BadRequestException('feesRp harus integer >= 0');
    }
    if (netAmountRp <= 0) {
      throw new BadRequestException('netAmountRp harus > 0 (gross - fees)');
    }

    const settledAt = new Date(dto.settledAt);
    if (isNaN(settledAt.getTime())) {
      throw new BadRequestException('settledAt tidak valid');
    }

    return this.prisma.$transaction(async (tx) => {
      // Lock auction row (race: settlement double submit)
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

      if (!auction) throw new NotFoundException('Auction tidak ditemukan');

      // Branch isolation
      if (auction.branchId !== user.branchId) {
        throw new ForbiddenException('Auction bukan milik cabang ini');
      }

      // Guard utama: settlement hanya kalau SOLD
      if (auction.status !== AuctionStatus.SOLD) {
        throw new BadRequestException(
          'Settlement hanya boleh dibuat untuk auction status SOLD',
        );
      }

      // Optional safety: cegah settlement “kedua” kalau kamu maunya cuma 1 kali.
      // Kalau kamu mau multi-settlement (setor bertahap), hapus blok ini.
      const existing = await tx.auctionSettlement.findFirst({
        where: { auctionId },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException('Settlement untuk auction ini sudah ada');
      }

      // 1) Create settlement (immutable)
      const settlement = await tx.auctionSettlement.create({
        data: {
          auctionId,
          branchId: auction.branchId,
          createdById: user.id,

          grossAmountRp: dto.grossAmountRp,
          feesRp,
          netAmountRp,

          settledAt,
          note: dto.note?.trim() || null,
        },
      });

      // 2) Create cash ledger IN (single source of truth kas)
      const ledger = await tx.cashLedger.create({
        data: {
          branchId: auction.branchId,
          userId: user.id,

          type: CashType.IN,
          source: CashSource.AUCTION,
          amountRp: netAmountRp,

          title: `Pelunasan Lelang ${auction.id}`,
          note: `Otomatis dari pelunasan lelang ${settlement.id}`,
          txnDate: settledAt,

          status: CashStatus.POSTED,
          category: CashCategory.OPERATIONAL,

          auctionSettlementId: settlement.id,
        },
      });

      return {
        settlementId: settlement.id,
        auctionId: settlement.auctionId,
        grossAmountRp: settlement.grossAmountRp,
        feesRp: settlement.feesRp,
        netAmountRp: settlement.netAmountRp,
        settledAt: settlement.settledAt,
        cashLedgerId: ledger.id,
      };
    });
  }

  async getSettlement(settlementId: string, user: { branchId: string }) {
    const s = await this.prisma.auctionSettlement.findUnique({
      where: { id: settlementId },
      include: {
        auction: { select: { id: true, loanId: true, branchId: true } },
        createdBy: { select: { id: true, fullName: true } },
        cashLedger: true,
      },
    });

    if (!s) throw new NotFoundException('Settlement tidak ditemukan');
    if (s.branchId !== user.branchId) {
      throw new ForbiddenException('Settlement bukan milik cabang ini');
    }

    return s;
  }
}
