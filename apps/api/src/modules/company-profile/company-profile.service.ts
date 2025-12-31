import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile() {
    const profile = await this.prisma.companyProfile.findFirst();
    if (!profile) {
      throw new BadRequestException('Company profile belum diset');
    }
    return profile;
  }

  async updateProfile(data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  }) {
    const profile = await this.prisma.companyProfile.findFirst();
    if (!profile) {
      throw new BadRequestException('Company profile belum diset');
    }

    return this.prisma.companyProfile.update({
      where: { id: profile.id },
      data,
    });
  }
}
