import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ReportSubmissionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Submit a transaction report (KASIR/ADMIN)
     */
    async submit(params: {
        branchId: string;
        submittedBy: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: any; // TransactionReportResult
        physicalCashRp: number;
        note?: string;
    }) {
        const submission = await this.prisma.reportSubmission.create({
            data: {
                branchId: params.branchId,
                submittedBy: params.submittedBy,
                periodStart: params.periodStart,
                periodEnd: params.periodEnd,
                reportData: params.reportData,
                physicalCashRp: params.physicalCashRp,
                note: params.note,
                status: 'PENDING',
            },
            include: {
                submitter: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Notify all managers (MANAJER is global, not per-branch)
        let managers = await this.prisma.user.findMany({
            where: {
                role: { name: 'MANAJER' },
                isActive: true,
            },
            include: {
                role: true,
            },
        });

        // Fallback to ADMIN in the same branch if no MANAJER found
        if (managers.length === 0) {
            managers = await this.prisma.user.findMany({
                where: {
                    branchId: params.branchId,
                    role: { name: 'ADMIN' },
                    isActive: true,
                },
                include: {
                    role: true,
                },
            });
            console.log(`[ReportSubmission] No MANAJER found, falling back to ${managers.length} ADMIN users in branch`);
        } else {
            console.log(`[ReportSubmission] Found ${managers.length} MANAJER (global) to notify`);
        }

        for (const manager of managers) {
            // Skip if manager is the submitter (don't notify yourself)
            if (manager.id === params.submittedBy) {
                console.log(`[ReportSubmission] Skipping notification to ${manager.username} (is the submitter)`);
                continue;
            }

            try {
                await this.notificationsService.create(
                    manager.id,
                    'Laporan Setoran Baru',
                    `Laporan setoran dari ${submission.submitter.fullName} (${submission.branch.name}) menunggu review`,
                    'INFO',
                    `/reports/submissions/${submission.id}`,
                );
                console.log(`[ReportSubmission] Notification sent to ${manager.username} (${manager.role.name})`);
            } catch (error) {
                console.error(`[ReportSubmission] Failed to send notification to ${manager.username}:`, error);
            }
        }

        return submission;
    }

    /**
     * List submissions
     * - KASIR: own submissions only
     * - MANAGER/ADMIN: all submissions for branch
     */
    async findAll(params: {
        branchId: string;
        userId: string;
        userRole: string;
        status?: ReportStatus;
    }) {
        const where: any = {
            branchId: params.branchId,
        };

        // KASIR can only see own submissions
        if (params.userRole === 'KASIR') {
            where.submittedBy = params.userId;
        }

        if (params.status) {
            where.status = params.status;
        }

        return this.prisma.reportSubmission.findMany({
            where,
            include: {
                submitter: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }

    /**
     * Get submission detail
     */
    async findById(id: string, userId: string, userRole: string) {
        const submission = await this.prisma.reportSubmission.findUnique({
            where: { id },
            include: {
                submitter: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!submission) {
            throw new NotFoundException('Submission tidak ditemukan');
        }

        // KASIR can only view own submissions
        if (userRole === 'KASIR' && submission.submittedBy !== userId) {
            throw new ForbiddenException('Tidak memiliki akses ke submission ini');
        }

        return submission;
    }

    /**
     * Review submission (MANAGER/ADMIN only)
     */
    async review(params: {
        id: string;
        reviewedBy: string;
        status: 'APPROVED' | 'REJECTED' | 'REVISED';
        reviewNote?: string;
    }) {
        const submission = await this.prisma.reportSubmission.findUnique({
            where: { id: params.id },
        });

        if (!submission) {
            throw new NotFoundException('Submission tidak ditemukan');
        }

        if (submission.status !== 'PENDING') {
            throw new ForbiddenException('Submission sudah direview');
        }

        const updated = await this.prisma.reportSubmission.update({
            where: { id: params.id },
            data: {
                status: params.status,
                reviewedBy: params.reviewedBy,
                reviewedAt: new Date(),
                reviewNote: params.reviewNote,
            },
            include: {
                submitter: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
                reviewer: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                    },
                },
            },
        });

        // Notify the submitter about the review
        const statusText = params.status === 'APPROVED' ? 'disetujui' : params.status === 'REJECTED' ? 'ditolak' : 'perlu revisi';
        const notifType = params.status === 'APPROVED' ? 'SUCCESS' : params.status === 'REJECTED' ? 'ERROR' : 'WARNING';

        try {
            await this.notificationsService.create(
                submission.submittedBy,
                `Laporan Setoran ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
                `Laporan setoran Anda telah ${statusText} oleh ${updated.reviewer?.fullName}`,
                notifType,
                `/reports/submissions/${submission.id}`,
            );
            console.log(`[ReportSubmission] Review notification sent to submitter ${submission.submittedBy}`);
        } catch (error) {
            console.error(`[ReportSubmission] Failed to send review notification to submitter:`, error);
        }

        return updated;
    }
}
