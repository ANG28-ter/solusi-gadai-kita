import { LoanStatus } from './types';

/**
 * Get interest rate tier information based on days used
 */
export function getInterestTierInfo(daysUsed: number) {
    if (daysUsed <= 15) {
        return {
            rate: 5,
            ratePercent: '5%',
            status: 'active' as const,
            tier: 1,
            description: '1-15 hari',
            color: 'green',
        };
    }

    if (daysUsed <= 30) {
        return {
            rate: 10,
            ratePercent: '10%',
            status: 'active' as const,
            tier: 2,
            description: '16-30 hari',
            color: 'yellow',
        };
    }

    return {
        rate: 10,
        ratePercent: '10%',
        status: 'overdue' as const,
        tier: 3,
        description: 'Lewat jatuh tempo',
        color: 'red',
    };
}

/**
 * Calculate payment allocation (interest first, then principal)
 */
export function calculatePaymentAllocation(
    paymentAmount: number,
    interestDue: number,
    principalDue: number
) {
    const toInterest = Math.min(paymentAmount, interestDue);
    const toPrincipal = Math.max(0, paymentAmount - toInterest);

    return {
        interestPaid: toInterest,
        principalPaid: Math.min(toPrincipal, principalDue),
        remainingInterest: Math.max(0, interestDue - toInterest),
        remainingPrincipal: Math.max(0, principalDue - toPrincipal),
    };
}

/**
 * Get progress percentage for days used (0-100%)
 */
export function getDaysUsedProgress(daysUsed: number, maxDays: number = 30): number {
    return Math.min((daysUsed / maxDays) * 100, 100);
}

/**
 * Get color class for days used indicator
 */
export function getDaysUsedColorClass(daysUsed: number): string {
    if (daysUsed <= 15) return 'bg-green-500';
    if (daysUsed <= 25) return 'bg-yellow-500';
    if (daysUsed <= 30) return 'bg-orange-500';
    return 'bg-red-500';
}

/**
 * Format days used display
 */
export function formatDaysUsed(daysUsed: number): string {
    if (daysUsed === 1) return '1 hari';
    return `${daysUsed} hari`;
}

/**
 * Calculate estimated interest for preview (before loan creation)
 */
export function calculateEstimatedInterest(principal: number, estimatedDays: number = 15) {
    const tierInfo = getInterestTierInfo(estimatedDays);
    const interestAmount = Math.floor((principal * tierInfo.rate) / 100);
    const totalDue = principal + interestAmount;

    return {
        interestRate: tierInfo.rate,
        interestAmount,
        totalDue,
        tierDescription: tierInfo.description,
    };
}

/**
 * Get all interest rate tiers for display/preview
 */
export function getAllInterestTiers(principal: number) {
    return [
        {
            days: '1-15',
            rate: 5,
            ratePercent: '5%',
            interestAmount: Math.floor((principal * 5) / 100),
            totalDue: principal + Math.floor((principal * 5) / 100),
            description: 'Bayar dalam 15 hari',
        },
        {
            days: '16-30',
            rate: 10,
            ratePercent: '10%',
            interestAmount: Math.floor((principal * 10) / 100),
            totalDue: principal + Math.floor((principal * 10) / 100),
            description: 'Bayar dalam 16-30 hari',
        },
        {
            days: '31+',
            rate: 10,
            ratePercent: '10%',
            interestAmount: Math.floor((principal * 10) / 100),
            totalDue: principal + Math.floor((principal * 10) / 100),
            description: 'Lewat jatuh tempo (tetap 10%)',
            isOverdue: true,
        },
    ];
}
