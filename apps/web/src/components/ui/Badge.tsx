import React from 'react';
import clsx from 'clsx';
import { LoanStatus, AuctionStatus, ContractStatus, CashStatus } from '@/lib/types';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className,
}: BadgeProps) {
    const baseStyles = 'inline-flex items-center font-semibold rounded-full';

    // Vibrant but simple colors - no animations
    const variants = {
        default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        success: 'bg-success-light dark:bg-success/20 text-success-dark dark:text-success',
        warning: 'bg-warning-light dark:bg-warning/20 text-warning-dark dark:text-warning',
        danger: 'bg-danger-light dark:bg-danger/20 text-danger-dark dark:text-danger',
        info: 'bg-info-light dark:bg-info/20 text-info-dark dark:text-info',
    };

    const sizes = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
    };

    return (
        <span className={clsx(baseStyles, variants[variant], sizes[size], className)}>
            {children}
        </span>
    );
}

// Specialized badge for loan status
export function LoanStatusBadge({ status }: { status: LoanStatus }) {
    const statusConfig = {
        [LoanStatus.ACTIVE]: { variant: 'success' as const, label: 'Aktif' },
        [LoanStatus.OVERDUE]: { variant: 'danger' as const, label: 'Jatuh Tempo' },
        [LoanStatus.LUNAS]: { variant: 'info' as const, label: 'Lunas' },
        [LoanStatus.CLOSED]: { variant: 'default' as const, label: 'Ditutup' },
    };

    const config = statusConfig[status] || { variant: 'default' as const, label: status || 'Unknown' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Specialized badge for auction status
export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
    const statusConfig = {
        [AuctionStatus.LISTED]: { variant: 'warning' as const, label: 'Terdaftar' },
        [AuctionStatus.SOLD]: { variant: 'success' as const, label: 'Terjual' },
        [AuctionStatus.CANCELLED]: { variant: 'default' as const, label: 'Dibatalkan' },
    };

    const config = statusConfig[status] || { variant: 'default' as const, label: status || 'Unknown' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Specialized badge for contract status
export function ContractStatusBadge({ status }: { status: ContractStatus }) {
    const statusConfig = {
        [ContractStatus.DRAFT]: { variant: 'warning' as const, label: 'Draft' },
        [ContractStatus.FINAL]: { variant: 'success' as const, label: 'Final' },
        [ContractStatus.VOID]: { variant: 'danger' as const, label: 'Batal' },
    };

    const config = statusConfig[status] || { variant: 'default' as const, label: status || 'Unknown' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Specialized badge for cash status
export function CashStatusBadge({ status }: { status: CashStatus }) {
    const statusConfig = {
        [CashStatus.POSTED]: { variant: 'success' as const, label: 'Posted' },
        [CashStatus.REVERSED]: { variant: 'danger' as const, label: 'Reversed' },
    };

    const config = statusConfig[status] || { variant: 'default' as const, label: status || 'Unknown' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
