import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, AuctionStatus, CashType, CashStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(branchId?: string) {
        const whereBranch = branchId ? { branchId } : {};

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // 1. Loans Stats
        const activeLoansCount = await this.prisma.loan.count({
            where: { ...whereBranch, status: LoanStatus.ACTIVE },
        });

        const overdueLoansCount = await this.prisma.loan.count({
            where: { ...whereBranch, status: LoanStatus.OVERDUE },
        });

        const lunasThisMonthCount = await this.prisma.loan.count({
            where: {
                ...whereBranch,
                status: LoanStatus.LUNAS,
                finalizedAt: {
                    gte: monthStart,
                    lt: nextMonthStart,
                },
            },
        });

        const activeLoansTotal = await this.prisma.loan.aggregate({
            where: { ...whereBranch, status: LoanStatus.ACTIVE },
            _sum: { principalRp: true },
        });

        // 2. Payments Stats (Today)
        const paymentsToday = await this.prisma.payment.aggregate({
            where: {
                ...whereBranch,
                paidAt: {
                    gte: todayStart,
                    lt: tomorrowStart,
                },
            },
            _sum: {
                amountRp: true,
                interestRecordedRp: true,
            },
            _count: true,
        });

        // Payments This Month
        const paymentsThisMonth = await this.prisma.payment.aggregate({
            where: {
                ...whereBranch,
                paidAt: {
                    gte: monthStart,
                    lt: nextMonthStart,
                },
            },
            _sum: {
                amountRp: true,
            },
            _count: true,
        });

        // 3. CashLedger Stats (Today & Balance)
        // Cash In Today
        const cashInToday = await this.prisma.cashLedger.aggregate({
            where: {
                ...whereBranch,
                type: CashType.IN,
                status: CashStatus.POSTED,
                txnDate: {
                    gte: todayStart,
                    lt: tomorrowStart,
                }
            },
            _sum: { amountRp: true },
        });

        // Cash Out Today
        const cashOutToday = await this.prisma.cashLedger.aggregate({
            where: {
                ...whereBranch,
                type: CashType.OUT,
                status: CashStatus.POSTED,
                txnDate: {
                    gte: todayStart,
                    lt: tomorrowStart,
                }
            },
            _sum: { amountRp: true },
        });

        // Cash In This Month
        const cashInThisMonth = await this.prisma.cashLedger.aggregate({
            where: {
                ...whereBranch,
                type: CashType.IN,
                status: CashStatus.POSTED,
                txnDate: {
                    gte: monthStart,
                    lt: nextMonthStart,
                }
            },
            _sum: { amountRp: true },
        });

        // Cash Out This Month
        const cashOutThisMonth = await this.prisma.cashLedger.aggregate({
            where: {
                ...whereBranch,
                type: CashType.OUT,
                status: CashStatus.POSTED,
                txnDate: {
                    gte: monthStart,
                    lt: nextMonthStart,
                }
            },
            _sum: { amountRp: true },
        });

        // Balance (Total In - Total Out) - simplified. 
        // In a real accounting system we might query a snapshot + delta, but for now sum all.
        // If performance is an issue, we should fix this later.
        const totalCashIn = await this.prisma.cashLedger.aggregate({
            where: { ...whereBranch, type: CashType.IN, status: CashStatus.POSTED },
            _sum: { amountRp: true },
        });
        const totalCashOut = await this.prisma.cashLedger.aggregate({
            where: { ...whereBranch, type: CashType.OUT, status: CashStatus.POSTED },
            _sum: { amountRp: true },
        });
        const balance = (totalCashIn._sum.amountRp || 0) - (totalCashOut._sum.amountRp || 0);


        // 4. Auctions Stats
        const auctionsListed = await this.prisma.auctionListing.count({
            where: { ...whereBranch, status: AuctionStatus.LISTED },
        });

        // Calculate week range for due loans
        const weekEnd = new Date(todayStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Loans due this week (will become overdue in next 7 days)
        const loansDueThisWeek = await this.prisma.loan.count({
            where: {
                ...whereBranch,
                status: LoanStatus.ACTIVE,
                dueDate: {
                    gte: todayStart,
                    lt: weekEnd
                }
            }
        });

        const auctionsSoldMonth = await this.prisma.auctionListing.count({
            where: {
                ...whereBranch,
                status: AuctionStatus.SOLD,
                closedAt: {
                    gte: monthStart,  // Start of current month
                    lt: nextMonthStart  // Start of next month
                }
            }
        });

        // 5. Customers
        const customersTotal = await this.prisma.customer.count({
            where: { ...whereBranch, isActive: true }
        });

        const customersNewMonth = await this.prisma.customer.count({
            where: {
                ...whereBranch,
                createdAt: { gte: monthStart }
            }
        });

        // 6. Recent Activity
        const recentLoans = await this.prisma.loan.findMany({
            where: { ...whereBranch },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { customer: true }
        });

        const recentPayments = await this.prisma.payment.findMany({
            where: { ...whereBranch },
            orderBy: { paidAt: 'desc' },
            take: 5,
            include: {
                loan: true, // simplified, frontend might need loan.code
                user: true
            }
        });


        return {
            stats: {
                loans: {
                    active: activeLoansCount,
                    overdue: overdueLoansCount,
                    lunasThisMonth: lunasThisMonthCount,
                    totalAmount: activeLoansTotal._sum.principalRp || 0,
                },
                cash: {
                    inToday: cashInToday._sum.amountRp || 0,
                    outToday: cashOutToday._sum.amountRp || 0,
                    inThisMonth: cashInThisMonth._sum.amountRp || 0,
                    outThisMonth: cashOutThisMonth._sum.amountRp || 0,
                    balance: balance,
                    changePercent: 0, // Placeholder
                },
                payments: {
                    totalToday: paymentsToday._sum.amountRp || 0,
                    countToday: paymentsToday._count || 0,
                    totalThisMonth: paymentsThisMonth._sum.amountRp || 0,
                    countThisMonth: paymentsThisMonth._count || 0,
                    averageAmount: (paymentsToday._count > 0) ? (paymentsToday._sum.amountRp || 0) / paymentsToday._count : 0,
                    interestCollected: paymentsToday._sum.interestRecordedRp || 0,
                },
                auctions: {
                    listed: auctionsListed,
                    dueThisWeek: loansDueThisWeek,  // Loans due in next 7 days
                    soldThisMonth: auctionsSoldMonth,
                    totalValue: 0,
                },
                customers: {
                    total: customersTotal,
                    newThisMonth: customersNewMonth,
                },
                users: {
                    activeInBranch: 0,
                }
            },
            recentLoans,
            recentPayments
        };
    }
}
