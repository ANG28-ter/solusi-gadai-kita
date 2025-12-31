import { Body, Controller, Get, Param, Post, UseGuards, Headers } from '@nestjs/common';
import { LoanDecisionsService } from './loans-decisions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateLoanDecisionDto } from './dto/create-loan-decision.dto';
import { extractSelectedBranch, getBranchFilter } from '../../../common/utils/branch-filter';

@Controller('/api/v1/loans/:loanId/decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAJER')
export class LoanDecisionsController {
  constructor(private readonly service: LoanDecisionsService) { }

  @Post()
  create(
    @Param('loanId') loanId: string,
    @Body() body: CreateLoanDecisionDto,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    // Pass user but override branchId with the selected one
    return this.service.createDecision(loanId, body, { ...user, branchId: filter.branchId });
  }

  @Get()
  list(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    return this.service.listDecisions(loanId, { ...user, branchId: filter.branchId });
  }
}
