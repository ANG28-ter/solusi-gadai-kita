import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuctionSettlementService } from './auction-settlement.service';
import { CreateAuctionSettlementDto } from '../dto/create-auctions-settlements.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/guards/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@Controller('/api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAJER')
export class AuctionSettlementController {
  constructor(private readonly service: AuctionSettlementService) {}

  @Post('/auctions/:auctionId/settlements')
  create(
    @Param('auctionId') auctionId: string,
    @Body() body: CreateAuctionSettlementDto,
    @CurrentUser() user: { id: string; branchId: string },
  ) {
    return this.service.createSettlement(auctionId, body, user);
  }

  @Get('/auction-settlements/:settlementId')
  get(
    @Param('settlementId') settlementId: string,
    @CurrentUser() user: { branchId: string },
  ) {
    return this.service.getSettlement(settlementId, user);
  }
}
