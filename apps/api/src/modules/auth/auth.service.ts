import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service"; // ✅ PENTING

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService // ✅ BENAR
  ) { }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { role: true, branch: true }
    });

    console.log('🔍 LOGIN DEBUG:', {
      username,
      foundUser: !!user,
      roleName: user?.role?.name,
      branchName: user?.branch?.name
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Username tidak ditemukan atau akun tidak aktif");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Password salah");
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role.name,
      branchId: user.branchId
    };

    console.log('🔍 TOKEN PAYLOAD:', payload);

    const token = await this.jwt.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role.name,
        branchId: user.branchId,
        fullName: user.fullName,
        branch: user.branch // ✅ Pass branch data to frontend
      }
    };
  }
}
