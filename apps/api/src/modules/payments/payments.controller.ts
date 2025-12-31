import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
  Get,
  Param,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payments.dto';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  /**
   * CREATE PAYMENT
   * - otomatis create CashLedger (source=PAYMENT)
   * - immutable
   * - branchId dari selected branch (Manager) atau user branch (Kasir)
   */
  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAJER)
  async create(@Body() dto: CreatePaymentDto, @Req() req: any, @Headers() headers: any) {
    if (!req.user?.id || !req.user?.branchId) {
      throw new UnauthorizedException('Invalid auth context');
    }

    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);

    return this.paymentsService.createPayment({
      loanId: dto.loanId,
      amountRp: dto.amountRp,
      paidAt: new Date(dto.paidAt),
      note: dto.note,
      userId: req.user.id,
      branchId: filter.branchId, // Use selected branch
    });
  }
  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAJER, RoleName.KASIR)
  async getOne(@Param('id') id: string, @Req() req: any, @Headers() headers: any) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.paymentsService.findById(id, filter.branchId);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.MANAJER, RoleName.KASIR)
  async findAll(@Req() req: any, @Headers() headers: any) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);

    return this.paymentsService.findAll({
      branchId: filter.branchId,
      loanId: req.query.loanId,
      page: req.query.page,
      limit: req.query.limit,
    });
  }

  @Post(':id/reverse')
  @Roles(RoleName.ADMIN, RoleName.MANAJER)
  async reverse(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    if (!reason || reason.length < 5) {
      throw new Error('Reason is required and must be at least 5 chars');
    }
    return this.paymentsService.reversePayment(id, req.user.id, reason);
  }
}
