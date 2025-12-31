import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async listUsers(input: { role: string; branchId: string }) {
    if (input.role === 'MANAJER') {
      return this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          isActive: true,
          lastActiveAt: true,
          role: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // ADMIN
    return this.prisma.user.findMany({
      where: { branchId: input.branchId },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        isActive: true,
        lastActiveAt: true,
        role: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createUser(dto: CreateUserDto) {
    // 1️⃣ Pastikan username unik
    const exists = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (exists) {
      throw new BadRequestException('Username sudah digunakan');
    }

    // 2️⃣ Pastikan branch valid
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch || !branch.isActive) {
      throw new BadRequestException('Cabang tidak valid atau tidak aktif');
    }

    // 3️⃣ Ambil role ID
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      throw new BadRequestException('Role tidak valid');
    }

    // 4️⃣ Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5️⃣ Create user
    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        roleId: role.id,
        branchId: branch.id,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        isActive: true,
        role: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Prepare update data
    const updateData: any = { ...dto };

    // Check if role update is requested
    if (dto.role) {
      const roleEntity = await this.prisma.role.findUnique({
        where: { name: dto.role as any },
      });
      if (!roleEntity) {
        throw new BadRequestException(`Role ${dto.role} tidak valid`);
      }
      updateData.roleId = roleEntity.id;
      delete updateData.role; // Remove role string from prisma data
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        isActive: true,
        role: { select: { name: true } },
        branch: { select: { name: true } }, // Include branch for context updates
      },
    });
  }

  async resetPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async deleteUser(userId: string) {
    try {
      return await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error: any) {
      // Catch Prisma P2003 (Foreign Key Constraint)
      // Also catch explicit Postgres error 23001 which might surface as a generic error message
      if (
        error.code === 'P2003' ||
        error.message?.includes('violates RESTRICT setting') ||
        error.message?.includes('foreign key constraint') ||
        error.toString().includes('code: "23001"')
      ) {
        throw new BadRequestException(
          'User tidak bisa dihapus permanen karena memiliki data transaksi (gadai, pembayaran, dll). Silakan nonaktifkan user saja.',
        );
      }
      throw error;
    }
  }

  /**
   * Force delete user by reassigning all their data to a replacement user
   * @param userId - User to delete
   * @param replacementUserId - User who will take over the deleted user's data
   */
  async forceDeleteUser(userId: string, replacementUserId: string) {
    // 1️⃣ Validate both users exist
    const [userToDelete, replacementUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: replacementUserId } }),
    ]);

    if (!userToDelete) {
      throw new NotFoundException('User yang akan dihapus tidak ditemukan');
    }

    if (!replacementUser) {
      throw new NotFoundException('User pengganti tidak ditemukan');
    }

    if (userId === replacementUserId) {
      throw new BadRequestException('User pengganti tidak boleh sama dengan user yang dihapus');
    }

    // 2️⃣ Check if user has any related data
    const [
      loansCreatedCount,
      paymentsCount,
      cashLedgersCount,
      decisionsCount,
      auctionsCreatedCount,
      auctionsClosedCount,
      contractsCreatedCount,
      contractsFinalizedCount,
      contractsVoidedCount,
      submittedReportsCount,
      reviewedReportsCount,
      auctionSettlementsCount,
    ] = await Promise.all([
      this.prisma.loan.count({ where: { createdById: userId } }),
      this.prisma.payment.count({ where: { userId } }),
      this.prisma.cashLedger.count({ where: { userId } }),
      this.prisma.loanDecision.count({ where: { userId } }),
      this.prisma.auctionListing.count({ where: { createdById: userId } }),
      this.prisma.auctionListing.count({ where: { closedById: userId } }),
      this.prisma.loanContract.count({ where: { createdById: userId } }),
      this.prisma.loanContract.count({ where: { finalizedById: userId } }),
      this.prisma.loanContract.count({ where: { voidedById: userId } }),
      this.prisma.reportSubmission.count({ where: { submittedBy: userId } }),
      this.prisma.reportSubmission.count({ where: { reviewedBy: userId } }),
      this.prisma.auctionSettlement.count({ where: { createdById: userId } }),
    ]);

    // 3️⃣ Perform reassignment in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Reassign loans created
      if (loansCreatedCount > 0) {
        await tx.loan.updateMany({
          where: { createdById: userId },
          data: { createdById: replacementUserId },
        });
      }

      // Reassign payments
      if (paymentsCount > 0) {
        await tx.payment.updateMany({
          where: { userId },
          data: { userId: replacementUserId },
        });
      }

      // Reassign cash ledgers
      if (cashLedgersCount > 0) {
        await tx.cashLedger.updateMany({
          where: { userId },
          data: { userId: replacementUserId },
        });
      }

      // Reassign loan decisions
      if (decisionsCount > 0) {
        await tx.loanDecision.updateMany({
          where: { userId },
          data: { userId: replacementUserId },
        });
      }

      // Reassign auctions created
      if (auctionsCreatedCount > 0) {
        await tx.auctionListing.updateMany({
          where: { createdById: userId },
          data: { createdById: replacementUserId },
        });
      }

      // Reassign auctions closed (nullable, so we can also set to null)
      if (auctionsClosedCount > 0) {
        await tx.auctionListing.updateMany({
          where: { closedById: userId },
          data: { closedById: replacementUserId },
        });
      }

      // Reassign contracts created
      if (contractsCreatedCount > 0) {
        await tx.loanContract.updateMany({
          where: { createdById: userId },
          data: { createdById: replacementUserId },
        });
      }

      // Reassign contracts finalized (nullable)
      if (contractsFinalizedCount > 0) {
        await tx.loanContract.updateMany({
          where: { finalizedById: userId },
          data: { finalizedById: replacementUserId },
        });
      }

      // Reassign contracts voided (nullable)
      if (contractsVoidedCount > 0) {
        await tx.loanContract.updateMany({
          where: { voidedById: userId },
          data: { voidedById: replacementUserId },
        });
      }

      // Reassign submitted reports
      if (submittedReportsCount > 0) {
        await tx.reportSubmission.updateMany({
          where: { submittedBy: userId },
          data: { submittedBy: replacementUserId },
        });
      }

      // Reassign reviewed reports (nullable)
      if (reviewedReportsCount > 0) {
        await tx.reportSubmission.updateMany({
          where: { reviewedBy: userId },
          data: { reviewedBy: replacementUserId },
        });
      }

      // Reassign auction settlements
      if (auctionSettlementsCount > 0) {
        await tx.auctionSettlement.updateMany({
          where: { createdById: userId },
          data: { createdById: replacementUserId },
        });
      }

      // Delete notifications (cascade delete)
      await tx.notification.deleteMany({
        where: { userId },
      });

      // Finally, delete the user
      const deletedUser = await tx.user.delete({
        where: { id: userId },
      });

      return {
        deletedUser,
        reassignedData: {
          loansCreated: loansCreatedCount,
          payments: paymentsCount,
          cashLedgers: cashLedgersCount,
          decisions: decisionsCount,
          auctionsCreated: auctionsCreatedCount,
          auctionsClosed: auctionsClosedCount,
          contractsCreated: contractsCreatedCount,
          contractsFinalized: contractsFinalizedCount,
          contractsVoided: contractsVoidedCount,
          submittedReports: submittedReportsCount,
          reviewedReports: reviewedReportsCount,
          auctionSettlements: auctionSettlementsCount,
        },
      };
    });
  }
}
