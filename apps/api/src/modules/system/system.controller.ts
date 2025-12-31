import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/guards/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('/api/v1/system')
export class SystemController {
  constructor(private readonly prisma: PrismaService) { }

  // MOVED TO BranchesController
  // @Roles('ADMIN', 'MANAJER', 'KASIR')
  // @Get('branches')
  // async getBranches() {
  //  return this.prisma.branch.findMany({
  //    where: { isActive: true },
  //    select: { id: true, name: true },
  //    orderBy: { name: 'asc' },
  //  });
  // }

  @Roles('ADMIN')
  @Get('ping')
  ping() {
    return { ok: true };
  }
}
