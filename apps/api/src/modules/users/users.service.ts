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
}
