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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  /**
   * UPLOAD CUSTOMER PHOTO
   * - Max 5MB
   * - JPG, JPEG, PNG only
   * - Replaces existing photo if any
   */
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.customersService.uploadPhoto(id, file, filter.branchId);
  }

  /**
   * DELETE CUSTOMER PHOTO
   */
  @Delete(':id/photo')
  async deletePhoto(
    @Param('id') id: string,
    @Req() req,
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.customersService.deletePhoto(id, filter.branchId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.MANAJER)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }
}
