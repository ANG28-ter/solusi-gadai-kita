import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  Headers,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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

  @Patch('/:id')
  update(@Param('id') id: string, @Body() body: CreateCollateralDto, @Req() req, @Headers() headers) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.update(id, body, filter.branchId);
  }

  /**
   * UPLOAD COLLATERAL PHOTOS
   * - Max 3 photos per collateral
   * - Max 5MB per photo
   * - JPG, JPEG, PNG only
   * - Appends to existing photos (up to max 3)
   */
  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('photos', 3)) // Max 3 files
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.uploadPhotos(id, files, filter.branchId);
  }

  /**
   * DELETE SPECIFIC COLLATERAL PHOTO BY INDEX
   * - Index is 0-based (0, 1, 2)
   */
  @Delete(':id/photos/:index')
  async deletePhoto(
    @Param('id') id: string,
    @Param('index') index: string,
    @Req() req,
    @Headers() headers,
  ) {
    const selectedBranch = extractSelectedBranch(headers);
    const filter = getBranchFilter(req.user, selectedBranch);
    return this.service.deletePhoto(id, parseInt(index, 10), filter.branchId);
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
