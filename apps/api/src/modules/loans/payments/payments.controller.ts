import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('/api/v1/loans/:loanId/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAJER')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) { }

  @Post()
  create(
    @Param('loanId') loanId: string,
    @Body() body: { amountRp: number; note?: string },
    @CurrentUser() user: { id: string; branchId: string },
  ) {
    return this.service.recordPayment(loanId, body, user);
  }

  @Get()
  list(@Param('loanId') loanId: string) {
    return this.service.listPayments(loanId);
  }

  @Post(':paymentId/reverse')
  reverse(
    @Param('loanId') loanId: string, // tetap diterima, walau tidak dipakai langsung
    @Param('paymentId') paymentId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: { id: string; branchId: string },
  ) {
    return this.service.reversePayment(paymentId, reason, user);
  }
}
