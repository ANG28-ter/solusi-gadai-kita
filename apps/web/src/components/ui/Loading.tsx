import React from 'react';
import clsx from 'clsx';

// Spinner Loading
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div
            className={clsx(
                'inline-block animate-spin rounded-full border-gray-300 border-t-[#1e3a5f]',
                sizes[size],
                className
            )}
        />
    );
}

// Full Page Loading
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
        </div>
    );
}

// Skeleton Loader for Cards
export function SkeletonCard() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
        </div>
    );
}

// Skeleton Loader for Table Rows
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="animate-pulse">
            {[...Array(columns)].map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
            ))}
        </tr>
    );
}

// Progress Bar
export function ProgressBar({
    value,
    max = 100,
    className,
    showLabel = false
}: {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
}) {
    const percentage = Math.min(100, (value / max) * 100);

    return (
        <div className={clsx('w-full', className)}>
            <div className="flex items-center justify-between mb-1">
                {showLabel && (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
