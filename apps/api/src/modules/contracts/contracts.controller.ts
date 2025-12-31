import { Controller, Get, Param, Post, Body, Query, UseGuards, Req, Headers } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractListQueryDTO } from './dto/contract-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RoleName } from '@prisma/client';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('/api/v1/contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.MANAJER, RoleName.KASIR)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) { }

  @Get()
  findAll(@Query() query: ContractListQueryDTO, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.contracts.findAll(query, filter.branchId);
  }

  @Get(':contractId')
  findOne(@Param('contractId') contractId: string) {
    return this.contracts.findOne(contractId);
  }

  @Get('loans/:loanId/preview')
  preview(@Param('loanId') loanId: string, @Req() req) {
    // Preview uses loan's branch (from database), no need for selected branch
    return this.contracts.preview(loanId, req.user);
  }

  @Post('loans/:loanId/finalize')
  finalize(@Param('loanId') loanId: string, @Req() req) {
    // Finalize uses loan's branch (from database), no need for selected branch
    return this.contracts.finalize(loanId, req.user);
  }

  @Post(':contractId/void')
  voidContract(
    @Param('contractId') contractId: string,
    @Body('reason') reason: string,
    @Req() req,
  ) {
    // Void uses contract's branch (from database), no need for selected branch
    return this.contracts.voidContract(
      contractId,
      req.user,
      reason,
    );
  }
}
