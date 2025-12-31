import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollateralDto } from './dto/create-collateral.dto';

@Injectable()
export class CollateralService {
  constructor(private readonly prisma: PrismaService) { }

  async create(input: CreateCollateralDto, branchId: string) {
    return this.prisma.collateralItem.create({
      data: {
        name: input.name,
        description: input.description,
        estimatedValueRp: input.estimatedValueRp,
        branchId, // Branch ownership
      },
    });
  }

  async listDraft(branchId?: string) {
    // Return all collateral items (not just drafts)
    // Include loan relation to show status
    const where: any = {};

    // Filter by collateral's own branchId (not loan's branch)
    if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.collateralItem.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            code: true,
            status: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignToLoan(collateralIds: string[], loanId: string) {
    if (!collateralIds.length) {
      throw new BadRequestException('CollateralIds tidak boleh kosong');
    }

    const result = await this.prisma.collateralItem.updateMany({
      where: {
        id: { in: collateralIds },
        loanId: null,
      },
      data: {
        loanId,
      },
    });

    if (result.count !== collateralIds.length) {
      throw new BadRequestException(
        'Sebagian collateral sudah terpakai atau tidak ditemukan',
      );
    }

    return result;
  }

  async findOne(id: string) {
    const collateral = await this.prisma.collateralItem.findUnique({
      where: { id },
      include: {
        loan: {
          select: {
            id: true,
            code: true,
            status: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!collateral) {
      throw new NotFoundException(`Collateral dengan ID ${id} tidak ditemukan`);
    }

    return collateral;
  }

  async delete(id: string) {
    // Check if exists
    const collateral = await this.findOne(id);

    // Check if attached to a loan
    // Check if attached to a loan
    if (collateral.loanId) {
      const loanStatus = collateral.loan?.status;
      if (loanStatus !== 'LUNAS' && loanStatus !== 'CLOSED') {
        throw new BadRequestException(
          'Tidak bisa menghapus barang jaminan yang sedang digunakan pada gadai aktif',
        );
      }
    }

    await this.prisma.collateralItem.delete({
      where: { id },
    });

    return { message: 'Barang jaminan berhasil dihapus' };
  }
}
