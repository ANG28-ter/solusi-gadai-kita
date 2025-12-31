import {
  Body,
  Controller,
  Post,
  Param,
  UseGuards,
  Get,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import { CashLedgerService } from './cash-ledger.service';
import { CashType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '@prisma/client';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('/api/v1/cash-ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashLedgerController {
  constructor(private readonly service: CashLedgerService) { }

  @Post('manual')
  @Roles(RoleName.KASIR, RoleName.MANAJER, RoleName.ADMIN)
  createManual(
    @Body() body: any,
    @Req() req: any,
    @Headers() headers: any,
  ) {
    const user = req.user;
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);

    return this.service.createManual({
      branchId: filter.branchId, // Use selected branch
      userId: user.id,
      type: body.type as CashType,
      amountRp: body.amountRp,
      title: body.title,
      note: body.note,
      txnDate: new Date(body.txnDate),
      category: body.category,
    });
  }

  @Post(':id/reverse')
  @Roles(RoleName.MANAJER, RoleName.ADMIN)
  reverse(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.reverseEntry(id, userId);
  }

  @Get()
  @Roles(RoleName.KASIR, RoleName.MANAJER, RoleName.ADMIN)
  async findAll(@Query() query: any, @Req() req: any, @Headers() headers: any) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);

    return this.service.findAll({
      branchId: filter.branchId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: Number(query.page),
      limit: Number(query.limit),
      source: query.source,
    });
  }

  @Get('summary')
  @Roles(RoleName.KASIR, RoleName.MANAJER, RoleName.ADMIN)
  async summary(@Query() query: any, @Req() req: any, @Headers() headers: any) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);

    return this.service.getSummary({
      branchId: filter.branchId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }
}
