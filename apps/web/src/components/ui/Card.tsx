import React from 'react';
import clsx from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export function Card({
    children,
    className,
    hover = false,
    onClick,
    style,
}: CardProps) {
    return (
        <div
            className={clsx(
                // Clean modern design: rounded corners, minimal shadow
                'rounded-3xl bg-white dark:bg-[#1A1F2E]',
                'border border-gray-200 dark:border-gray-800',
                // Very subtle shadow - lightweight
                'shadow-sm',
                hover && 'hover:shadow-md cursor-pointer',
                className
            )}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={clsx('px-6 py-5 border-b border-gray-200 dark:border-gray-800', className)}>
            {children}
        </div>
    );
}

export function CardBody({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={clsx('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={clsx('px-6 py-5 border-t border-gray-200 dark:border-gray-800', className)}>
            {children}
        </div>
    );
}
