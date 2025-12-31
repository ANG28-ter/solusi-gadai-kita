import { Controller, Get, Param, Post, UseGuards, Body, Query, Req, Headers } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CloseAuctionDto } from './dto/close-auction.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { getBranchFilter, extractSelectedBranch } from '../../../common/utils/branch-filter';

@Controller('/api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAJER')
export class AuctionController {
  constructor(private readonly service: AuctionService) { }

  @Get('/auctions')
  list(@Query('status') status: string | undefined, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.listAuctions(status as any, filter.branchId);
  }

  @Post('/loans/:loanId/auction')
  create(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    return this.service.createAuction(loanId, { id: user.id, branchId: filter.branchId });
  }

  @Get('/auctions/:auctionId')
  get(@Param('auctionId') auctionId: string) {
    return this.service.getAuction(auctionId);
  }

  @Post('/auctions/:auctionId/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAJER')
  close(
    @Param('auctionId') auctionId: string,
    @Body() body: CloseAuctionDto,
    @CurrentUser() user: { id: string; branchId: string; role: string },
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(user, selectedBranch);
    return this.service.closeAuction(auctionId, body, { id: user.id, branchId: filter.branchId });
  }
}
