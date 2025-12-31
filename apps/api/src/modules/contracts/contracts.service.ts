import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanCalculationService } from '../loans/services/loans-calculation.service';
import { ContractTemplateV1 } from './templates/contract-template.v1';
import { ContractPreviewDTO } from './dto/contract-preview.dto';
import { ContractListItemDTO, ContractListQueryDTO } from './dto/contract-list.dto';
import { createHash } from 'crypto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanCalc: LoanCalculationService,
  ) { }

  /**
   * ============================
   * LIST ALL CONTRACTS
   * ============================
   */
  async findAll(query: ContractListQueryDTO, branchId?: string): Promise<{
    data: ContractListItemDTO[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Status filter
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    // Branch filter from parameter (takes precedence over query)
    if (branchId) {
      where.branchId = branchId;
    } else if (query.branchId) {
      where.branchId = query.branchId;
    }

    // Search filter (contract no, customer name, or loan code)
    if (query.search) {
      where.OR = [
        { contractNo: { contains: query.search, mode: 'insensitive' } },
        { loan: { code: { contains: query.search, mode: 'insensitive' } } },
        { loan: { customer: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    // Get total count
    const total = await this.prisma.loanContract.count({ where });

    // Get contracts
    const contracts = await this.prisma.loanContract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { finalizedAt: 'desc' },
      include: {
        loan: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                nik: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const data: ContractListItemDTO[] = contracts.map((contract: any) => ({
      id: contract.id,
      contractNo: contract.contractNo,
      status: contract.status as 'FINAL' | 'VOID',
      templateVersion: contract.templateVersion,
      finalizedAt: contract.finalizedAt,
      voidedAt: contract.voidedAt,
      voidReason: contract.voidReason,
      loan: {
        id: contract.loan.id,
        code: contract.loan.code,
        principalRp: contract.loan.principalRp,
        status: contract.loan.status,
        customer: {
          id: contract.loan.customer.id,
          fullName: contract.loan.customer.fullName,
          nik: contract.loan.customer.nik,
        },
      },
      branch: {
        id: contract.branch.id,
        name: contract.branch.name,
        code: '', // Branch code not available in schema, will use empty string or fetch separately
      },
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ============================
   * GET SINGLE CONTRACT
   * ============================
   */
  async findOne(contractId: string) {
    const contract = await this.prisma.loanContract.findUnique({
      where: { id: contractId },
      include: {
        loan: {
          include: {
            customer: true,
            collaterals: true,
            payments: true,
          },
        },
        branch: true,
        finalizedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        voidedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    return contract;
  }

  /**
   * ============================
   * PREVIEW (READ ONLY)
   * ============================
   */
  async preview(
    loanId: string,
    user: {
      id: string;
      fullName: string;
      branchId: string;
    },
  ): Promise<ContractPreviewDTO> {
    // 1. Fetch branch code
    const branch = await this.prisma.branch.findUnique({
      where: { id: user.branchId },
      select: { code: true },
    });
    const branchCode = branch?.code || 'XX';

    // 2. Fetch User Full Name (req.user might not have it)
    const userDetail = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true },
    });
    const fullName = userDetail?.fullName || user.fullName || 'Pegadaian User';

    return this.buildContractSnapshot({
      loanId,
      user: { ...user, branchCode, fullName },
      now: new Date(),
      contractCode: null, // preview TIDAK punya kode
    });
  }

  /**
   * ============================
   * FINALIZE CONTRACT
   * ============================
   */
  async finalize(
    loanId: string,
    user: {
      id: string;
      fullName: string;
      branchId: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: { id: true, branchId: true, createdById: true },
      });

      if (!loan) {
        throw new NotFoundException('Loan tidak ditemukan');
      }

      // Fetch branch code from database
      const branch = await tx.branch.findUnique({
        where: { id: loan.branchId },
        select: { code: true },
      });
      const branchCode = branch?.code || 'XX';

      // Fetch User Full Name
      const userDetail = await tx.user.findUnique({
        where: { id: user.id },
        select: { fullName: true },
      });
      const fullName = userDetail?.fullName || user.fullName || 'Pegadaian User';

      // 1. Pastikan belum ada kontrak FINAL
      const existingFinal = await tx.loanContract.findFirst({
        where: { loanId, status: 'FINAL' },
      });
      if (existingFinal) {
        throw new ForbiddenException('Loan sudah memiliki kontrak FINAL');
      }

      const now = new Date();

      // 2. Generate KODE KONTRAK
      const contractCode = await this.nextContractCode(tx, {
        branchId: loan.branchId,
        branchCode,
        now,
      });

      // 3. Build snapshot
      const snapshot = await this.buildContractSnapshot({
        loanId,
        user: { ...user, branchCode, fullName },
        now,
        contractCode,
      });

      // 4. Hash snapshot
      const snapshotHash = createHash('sha256')
        .update(JSON.stringify(snapshot))
        .digest('hex');

      // 5. Simpan kontrak FINAL
      const contract = await tx.loanContract.create({
        data: {
          loanId,
          branchId: loan.branchId,
          createdById: loan.createdById,

          status: 'FINAL',
          contractNo: contractCode,
          templateVersion: snapshot.templateVersion,

          snapshotJson: snapshot,
          snapshotHashSha256: snapshotHash,

          finalizedAt: now,
          finalizedById: loan.createdById,
        },
      });

      // 6. Update loan
      await tx.loan.update({
        where: { id: loanId },
        data: {
          finalizedAt: now,
        },
      });

      return contract;
    });
  }

  /**
   * ============================
   * CORE SNAPSHOT BUILDER
   * (dipakai PREVIEW & FINAL)
   * ============================
   */
  private async buildContractSnapshot(params: {
    loanId: string;
    user: {
      id: string;
      fullName: string;
      branchId: string;
      branchCode: string;
    };
    now: Date;
    contractCode: string | null;
  }): Promise<ContractPreviewDTO> {
    const { loanId, user, now, contractCode } = params;

    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        collaterals: true,
      },
    });

    if (!loan) throw new NotFoundException('Loan tidak ditemukan');
    if (!loan.customer) throw new ForbiddenException('Customer belum ada');
    if (!loan.collaterals?.length)
      throw new ForbiddenException('Collateral belum ada');

    // total taksiran barang
    const estimatedValueRp = loan.collaterals.reduce(
      (sum, c) => sum + (c.estimatedValueRp ?? 0),
      0,
    );

    const adminFeeRp = loan.adminFeeRp ?? 0;
    const netDisbursedRp = loan.principalRp - adminFeeRp;

    return {
      templateVersion: ContractTemplateV1.templateVersion,
      company: ContractTemplateV1.company,

      meta: {
        contractCode,
        branchCode: user.branchCode,
        transactionAt: now.toISOString(),
        effectiveAt: loan.startDate.toISOString(),
        dueAt: loan.dueDate.toISOString(),
        cashierName: user.fullName,
      },

      customer: {
        nik: loan.customer.nik,
        fullName: loan.customer.fullName,
        address: loan.customer.address ?? null,
        phone: loan.customer.phone ?? null,
      },

      items: loan.collaterals.map((c, idx) => ({
        no: idx + 1,
        name: c.name,
        description: c.description ?? null,
        estimatedValueRp: c.estimatedValueRp ?? null,
      })),

      financial: {
        estimatedValueRp,
     
        principalRp: loan.principalRp,
        adminFeeRp,
        netDisbursedRp,
        tenorDays: 30,
      },

      clauses: ContractTemplateV1.clauses,
    };
  }

  /**
   * ============================
   * CONTRACT CODE GENERATOR
   * ============================
   */
  private async nextContractCode(
    tx: any,
    params: { branchId: string; branchCode: string; now: Date },
  ) {
    const year = params.now.getUTCFullYear();

    const seq = await tx.contractSequence.upsert({
      where: { branchId_year: { branchId: params.branchId, year } },
      create: { branchId: params.branchId, year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });

    const running = String(seq.lastNumber).padStart(6, '0');
    // Format: BDG-2025-000001 (clean and simple)
    return `SBG-${params.branchCode}-${year}-${running}`;
  }


  async voidContract(contractId: string, user: { id: string }, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Ambil kontrak + loan
      const contract = await tx.loanContract.findUnique({
        where: { id: contractId },
        include: {
          loan: {
            include: { payments: true },
          },
        },
      });

      // 2. Validasi eksistensi
      if (!contract) {
        throw new NotFoundException('Kontrak tidak ditemukan');
      }

      // 3. Validasi status
      if (contract.status !== 'FINAL') {
        throw new ForbiddenException(
          'Hanya kontrak FINAL yang dapat dibatalkan',
        );
      }

      // 4. Validasi transaksi turunan
      if (contract.loan.payments.length > 0) {
        throw new ForbiddenException(
          'Kontrak tidak dapat dibatalkan karena sudah ada pembayaran',
        );
      }

      // 5. Validasi reason
      if (!reason || reason.trim().length < 5) {
        throw new ForbiddenException('Alasan pembatalan wajib diisi');
      }

      // 6. Update kontrak (VOID)
      return tx.loanContract.update({
        where: { id: contractId },
        data: {
          status: 'VOID',
          voidedAt: new Date(),
          // Only set voidedById if user.id is valid (not mock ID)
          voidedById: user?.id && user.id !== 'user-id' ? user.id : null,
          voidReason: reason.trim(),
        },
      });
    });
  }
}
