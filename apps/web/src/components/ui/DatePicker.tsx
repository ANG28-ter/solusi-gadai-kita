"use client";

import React, { useId } from 'react';
import clsx from 'clsx';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    showTime?: boolean;
}

export function DatePicker({
    label,
    error,
    helperText,
    fullWidth = false,
    showTime = false,
    className,
    id,
    ...props
}: DatePickerProps) {
    const generatedId = useId();
    const inputId = id || generatedId;

    const baseStyles = 'block w-full rounded-lg border bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2';

    const errorStyles = error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]';

    return (
        <div className={clsx(fullWidth && 'w-full', className)}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                type={showTime ? 'datetime-local' : 'date'}
                className={clsx(baseStyles, errorStyles)}
                {...props}
            />

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
        </div>
    );
}
