import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfileController } from './company-profile.controller';

@Module({
  imports: [PrismaModule],
  providers: [CompanyProfileService],
  controllers: [CompanyProfileController],
})
export class CompanyProfileModule {}
