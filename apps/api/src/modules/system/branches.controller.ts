import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ForbiddenException,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { RoleName } from '@prisma/client';

@Controller('/api/v1/system/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async list(@Req() req) {
        return this.prisma.branch.findMany({
            orderBy: { name: 'asc' },
            // Removed filter to allow seeing non-active branches for management
        });
    }

    @Post()
    @Roles(RoleName.MANAJER)
    async create(@Body() dto: CreateBranchDto) {
        // Validate code uniqueness manually to give better error message?
        // Prisma throws P2002 on unique constraint.
        // We let GlobalFilter handle or we can catch.
        return this.prisma.branch.create({
            data: {
                code: dto.code.toUpperCase(), // Auto uppercase for code
                name: dto.name,
                address: dto.address,
                phone: dto.phone,
                isActive: true,
            },
        });
    }

    @Put(':id')
    @Roles(RoleName.MANAJER)
    async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
        return this.prisma.branch.update({
            where: { id },
            data: {
                ...dto,
                code: dto.code?.toUpperCase(),
            },
        });
    }

    @Delete(':id')
    @Roles(RoleName.MANAJER)
    async delete(@Param('id') id: string) {
        try {
            return await this.prisma.branch.delete({
                where: { id },
            });
        } catch (error: any) {
            // Catch Foreign Key Constraint errors
            if (
                error.code === 'P2003' ||
                error.message?.includes('violates RESTRICT setting') ||
                error.message?.includes('foreign key constraint') ||
                error.toString().includes('code: "23001"')
            ) {
                // If deletion fails due to relation, we don't fallback to soft delete automatically 
                // because the user requested "Hard Delete".
                // Instead, we throw a clear error so the frontend can suggest strict steps.
                throw new ForbiddenException(
                    'Cabang tidak bisa dihapus permanen karena masih memiliki data (user, nasabah, gadai, dll). Silakan nonaktifkan cabang saja.',
                );
            }
            throw error;
        }
    }
}
