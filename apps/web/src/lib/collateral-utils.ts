import { CollateralItem } from '@/lib/types';

// Helper function to get collateral status
export function getCollateralStatus(item: CollateralItem): string {
    // No loan = Available
    if (!item.loanId || !item.loan) {
        return 'Tersedia';
    }

    // Check auction status first
    if (item.loan.auction) {
        if (item.loan.auction.status === 'SOLD') {
            return 'Terjual';
        }
        if (item.loan.auction.status === 'LISTED') {
            return 'Di Lelang';
        }
    }

    // Check loan status
    if (item.loan.status === 'CLOSED') {
        return 'Ditutup';
    }

    if (item.loan.status === 'LUNAS') {
        return 'Lunas';
    }

    // Active or Overdue = Sedang Digadaikan
    if (item.loan.status === 'ACTIVE' || item.loan.status === 'OVERDUE') {
        return 'Sedang Digadaikan';
    }

    return 'Tersedia';
}

// Get status color/variant
export function getCollateralStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
    switch (status) {
        case 'Tersedia':
            return 'success';
        case 'Sedang Digadaikan':
            return 'warning';
        case 'Di Lelang':
            return 'info';
        case 'Terjual':
        case 'Ditutup':
            return 'default';
        case 'Lunas':
            return 'success';
        default:
            return 'default';
    }
}
