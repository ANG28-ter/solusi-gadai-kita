import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule, // akses PrismaService
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    UsersService,
  ],
  exports: [
    // ❌ TIDAK PERLU export UsersService
    // User management tidak boleh dipakai domain lain
  ],
})
export class UsersModule {}