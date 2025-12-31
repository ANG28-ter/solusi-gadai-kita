import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Delete,
  Param,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customers.dto';
import { FindCustomersQuery } from './dto/find-customers.query';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('/api/v1/customers')
@UseGuards(JwtAuthGuard) // All endpoints require auth
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  /**
   * CREATE CUSTOMER
   * - code digenerate di service
   * - nik unique
   * - branchId dari selected branch (Manager) atau user branch (Kasir)
   */
  @Post()
  async create(@Body() dto: CreateCustomerDto, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.customersService.create(dto, { branchId: filter.branchId });
  }

  /**
   * LIST / SEARCH CUSTOMER
   * - pagination
   * - search by code, name, nik, phone
   * - exclude soft-deleted
   * - FILTERED BY BRANCH
   */
  @Get()
  async findAll(@Query() query: FindCustomersQuery, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.customersService.findAll(query, filter.branchId);
  }

  @Get('by-code/:code')
  async findOneByCode(@Param('code') code: string) {
    return this.customersService.findOneByCode(code);
  }

  @Get(':id')
  async findOneById(@Param('id') id: string) {
    return this.customersService.findOneById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.MANAJER)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }
}
