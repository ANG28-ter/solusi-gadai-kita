import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, Headers } from '@nestjs/common';
import { CollateralService } from './collateral.service';
import { CreateCollateralDto } from './dto/create-collateral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('/api/v1/collaterals')
@UseGuards(JwtAuthGuard)
export class CollateralController {
  constructor(private readonly service: CollateralService) { }

  @Post()
  create(@Body() body: CreateCollateralDto, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.create(body, filter.branchId);
  }

  @Get('/draft')
  listDraft(@Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.listDraft(filter.branchId);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
