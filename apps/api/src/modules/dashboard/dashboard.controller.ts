import { Controller, Get, Req, Headers, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getBranchFilter, extractSelectedBranch } from '../../common/utils/branch-filter';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly service: DashboardService) { }

    @Get()
    async getStats(@Req() req, @Headers() headers) {
        const selectedBranch = extractSelectedBranch(headers);
        const filter = getBranchFilter(req.user, selectedBranch);

        // Pass the branchId to the service (it handles undefined for "ALL")
        return this.service.getStats(filter.branchId);
    }
}
