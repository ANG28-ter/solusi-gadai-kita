import React from 'react';
import clsx from 'clsx';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
}: PaginationProps) {
    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
    const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

    return (
        <div className={clsx('flex items-center justify-between', className)}>
            {/* Info Text */}
            {totalItems && itemsPerPage && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    Menampilkan <span className="font-medium">{startItem}</span> -{' '}
                    <span className="font-medium">{endItem}</span> dari{' '}
                    <span className="font-medium">{totalItems}</span> data
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={clsx(
                        'flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors',
                        currentPage === 1
                            ? 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                >
                    <FiChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                </button>

                {pageNumbers.map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="px-3 py-2 text-gray-500">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={clsx(
                                    'px-3 py-2 rounded-lg border transition-colors',
                                    page === currentPage
                                        ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] text-white border-transparent'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                )}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={clsx(
                        'flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors',
                        currentPage === totalPages
                            ? 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
