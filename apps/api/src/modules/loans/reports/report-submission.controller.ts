import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    BadRequestException,
    Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { RoleName } from '@prisma/client';
import { ReportSubmissionService } from './report-submission.service';
import { getBranchFilter, extractSelectedBranch } from '../../../common/utils/branch-filter';

@Controller('/api/v1/reports/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportSubmissionController {
    constructor(private readonly service: ReportSubmissionService) { }

    /**
     * Submit report (KASIR/ADMIN)
     */
    @Post()
    @Roles(RoleName.KASIR, RoleName.ADMIN, RoleName.MANAJER)
    async submit(
        @Req() req: Request & { user: { id: string; branchId: string; role: string } },
        @Headers() headers: any,
        @Body() body: {
            periodStart: string;
            periodEnd: string;
            reportData: any;
            physicalCashRp: number;
            note?: string;
        },
    ) {
        if (!body.periodStart || !body.periodEnd) {
            throw new BadRequestException('Period start and end required');
        }

        const selectedBranch = extractSelectedBranch(headers);
        const filter = getBranchFilter(req.user, selectedBranch);

        return this.service.submit({
            branchId: filter.branchId, // Use selected branch
            submittedBy: req.user.id,
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
            reportData: body.reportData,
            physicalCashRp: body.physicalCashRp,
            note: body.note,
        });
    }

    /**
     * List submissions
     */
    @Get()
    @Roles(RoleName.KASIR, RoleName.MANAJER, RoleName.ADMIN)
    async findAll(
        @Req() req: Request & { user: { id: string; branchId: string; role: string } },
        @Headers() headers: any,
        @Query('status') status?: string,
    ) {
        const selectedBranch = extractSelectedBranch(headers);
        const filter = getBranchFilter(req.user, selectedBranch);

        return this.service.findAll({
            branchId: filter.branchId,
            userId: req.user.id,
            userRole: req.user.role,
            status: status as any,
        });
    }

    /**
     * Get submission detail
     */
    @Get(':id')
    @Roles(RoleName.KASIR, RoleName.MANAJER, RoleName.ADMIN)
    async findOne(
        @Req() req: Request & { user: { id: string; role: { name: string } } },
        @Param('id') id: string,
    ) {
        return this.service.findById(id, req.user.id, req.user.role.name);
    }

    /**
     * Review submission (MANAJER only)
     */
    @Patch(':id/review')
    @Roles(RoleName.MANAJER)
    async review(
        @Req() req: Request & { user: { id: string } },
        @Param('id') id: string,
        @Body() body: {
            status: 'APPROVED' | 'REJECTED' | 'REVISED';
            reviewNote?: string;
        },
    ) {
        if (!['APPROVED', 'REJECTED', 'REVISED'].includes(body.status)) {
            throw new BadRequestException('Invalid status');
        }

        return this.service.review({
            id,
            reviewedBy: req.user.id,
            status: body.status,
            reviewNote: body.reviewNote,
        });
    }
}
