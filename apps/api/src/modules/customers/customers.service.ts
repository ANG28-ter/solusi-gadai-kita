import {
  ConflictException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from '../customers/dto/create-customers.dto';
import { FindCustomersQuery } from './dto/find-customers.query';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  private buildCustomerCode(year: number, seq: number): string {
    return `CST-${year}-${String(seq).padStart(5, '0')}`;
  }

  async create(dto: CreateCustomerDto, user: { branchId: string }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const year = new Date().getFullYear();

        // 1️⃣ ambil & increment sequence
        const seq = await tx.customerSequence.upsert({
          where: { year },
          create: { year, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });

        const code = this.buildCustomerCode(year, seq.lastNumber);

        // 2️⃣ create customer with branch ownership
        const customer = await tx.customer.create({
          data: {
            code,
            nik: dto.nik,
            fullName: dto.name,
            phone: dto.phone,
            address: dto.address,
            branchId: user.branchId, // Branch ownership
          },
        });

        return customer;
      });
    } catch (err: any) {
      // Unique constraint (nik / code)
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `Customer already exists (${err.meta?.target?.join(', ')})`,
        );
      }
      throw err;
    }
  }

  async softDelete(customerId: string) {
    // 1) pastikan customer ada & belum terhapus
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 2) blok delete kalau masih punya loan aktif / overdue
    // (rule bisnis minimal yang aman)
    const activeLoanCount = await this.prisma.loan.count({
      where: {
        customerId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    });

    if (activeLoanCount > 0) {
      throw new ForbiddenException('Customer has active/overdue loans');
    }

    // 3) soft delete
    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async findOneByCode(code: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        nik: true,
        fullName: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,

        loans: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // hitung summary loan (ringan & jelas)
    const totalLoans = customer.loans.length;
    const activeLoans = customer.loans.filter(
      (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE',
    ).length;

    const lastLoanStatus =
      customer.loans.length > 0
        ? customer.loans[customer.loans.length - 1].status
        : null;

    // jangan expose loans mentah
    const { loans, ...rest } = customer;

    return {
      ...rest,
      summary: {
        totalLoans,
        activeLoans,
        lastLoanStatus,
      },
    };
  }

  async findOneById(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        nik: true,
        fullName: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        loans: {
          select: {
            id: true,
            code: true,
            status: true,
            startDate: true,
            dueDate: true,
            principalRp: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findAll(query: FindCustomersQuery, branchId: string) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      branchId, // Branch filter
    };

    if (query.q) {
      where.OR = [
        { code: { contains: query.q, mode: 'insensitive' } },
        { fullName: { contains: query.q, mode: 'insensitive' } },
        { nik: { contains: query.q } },
        { phone: { contains: query.q } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
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
}
