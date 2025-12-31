import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { BranchesController } from './branches.controller';

@Module({
  controllers: [SystemController, BranchesController],
})
export class SystemModule { }
