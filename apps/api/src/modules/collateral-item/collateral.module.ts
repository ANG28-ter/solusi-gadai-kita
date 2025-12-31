import { Module } from '@nestjs/common';
import { CollateralController } from './collateral.controller';
import { CollateralService } from './collateral.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CollateralController],
  providers: [CollateralService, PrismaService],
  exports: [CollateralService],
})
export class CollateralModule {}
