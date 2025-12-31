import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyProfileService } from './company-profile.service';

@Controller('/api/v1/company-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyProfileController {
  constructor(private readonly service: CompanyProfileService) { }

  @Get()
  async get() {
    return this.service.getProfile();
  }

  @Put()
  @Roles(RoleName.MANAJER)
  async update(@Body() body, @Req() req) {
    return this.service.updateProfile(body);
  }
}
