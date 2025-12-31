import { Module } from '@nestjs/common';
import { CollateralController } from './collateral.controller';
import { CollateralService } from './collateral.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadModule } from '../../common/file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [CollateralController],
  providers: [CollateralService, PrismaService],
  exports: [CollateralService],
})
export class CollateralModule { }
