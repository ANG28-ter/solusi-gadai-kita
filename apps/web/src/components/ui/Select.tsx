"use client";

import React, { useId } from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    options: Array<{ value: string; label: string }>;
}

export function Select({
    label,
    error,
    helperText,
    fullWidth = false,
    options,
    className,
    id,
    ...props
}: SelectProps) {
    const generatedId = useId();
    const selectId = id || generatedId;

    const baseStyles = 'block w-full rounded-lg border bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none';

    const errorStyles = error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <div className={clsx(fullWidth && 'w-full', className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    id={selectId}
                    className={clsx(baseStyles, errorStyles, 'pr-10')}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown arrow icon */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
        </div>
    );
}
