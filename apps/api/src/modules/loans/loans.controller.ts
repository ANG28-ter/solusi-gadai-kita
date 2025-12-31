import { Body, Controller, Get, Post, Patch, Delete, UseGuards, Req, Headers } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoanReadService } from './loans-read.service';
import { Roles } from '../auth/guards/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('/api/v1/loans')
@UseGuards(JwtAuthGuard, RolesGuard) // ⬅️ INI YANG HILANG
@Roles('ADMIN', 'MANAJER')
export class LoansController {
  constructor(
    private readonly service: LoansService,
    private readonly loanReadService: LoanReadService,
  ) { }

  @Post()
  async create(
    @Body() body: CreateLoanDto,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    return this.service.create(body, { id: user.id, branchId: filter.branchId });
  }

  @Get()
  async findAll(@Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.findAll(filter.branchId);
  }

  @Get('/:id/summary')
  async getSummary(@Param('id') id: string, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.getSummary(id, filter.branchId);
  }

  @Get('/:id/remaining')
  async getRemaining(@Param('id') id: string, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.getRemaining(id, filter.branchId);
  }

  @Get(':id/timeline')
  @UseGuards(JwtAuthGuard)
  async getLoanTimeline(@Param('id') id: string, @Req() req) {
    const result = await this.loanReadService.getLoanTimeline(id, {
      branchId: req.user.branchId,
    });

    return {
      data: result,
      meta: {
        readModel: 'LOAN_TIMELINE_V1',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateLoanDto,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    return this.service.update(id, body, { id: user.id, branchId: filter.branchId });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
