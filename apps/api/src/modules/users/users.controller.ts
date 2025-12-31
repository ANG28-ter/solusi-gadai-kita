import {
  Controller,
  Get,
  Put,
  Param,
  Post,
  Body,
  Req,
  ForbiddenException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('/api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async list(@Req() req) {
    const { role, branchId } = req.user;

    if (role === 'KASIR') {
      throw new ForbiddenException('Kasir tidak boleh melihat data user');
    }

    return this.usersService.listUsers({
      role,
      branchId,
    });
  }

  @Put(':id')
  @Roles('MANAJER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Post()
  @Roles('MANAJER', 'ADMIN')
  async create(@Body() dto: CreateUserDto, @Req() req) {
    return this.usersService.createUser(dto);
  }

  @Put(':id/reset-password')
  async resetPassword(
    @Param('id') userId: string,
    @Body() dto: ResetPasswordDto,
    @Req() req,
  ) {
    if (req.user.role !== 'MANAJER') {
      throw new ForbiddenException(
        'Hanya manajer yang boleh reset password user',
      );
    }

    // Opsional tapi DIREKOMENDASIKAN
    if (req.user.id === userId) {
      throw new ForbiddenException('Gunakan fitur ganti password sendiri');
    }

    await this.usersService.resetPassword(userId, dto.newPassword);

    return { message: 'Password berhasil direset' };
  }

  @Delete(':id')
  @Delete(':id')
  @Roles('ADMIN', 'MANAJER')
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
