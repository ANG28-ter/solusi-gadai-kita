"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    title?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, type, message, title };

        setToasts((prev) => [...prev, toast]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    const success = useCallback((message: string, title?: string) => {
        showToast(message, 'success', title);
    }, [showToast]);

    const error = useCallback((message: string, title?: string) => {
        showToast(message, 'error', title);
    }, [showToast]);

    const info = useCallback((message: string, title?: string) => {
        showToast(message, 'info', title);
    }, [showToast]);

    const warning = useCallback((message: string, title?: string) => {
        showToast(message, 'warning', title);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <FiCheckCircle className="w-5 h-5" />,
        error: <FiXCircle className="w-5 h-5" />,
        info: <FiInfo className="w-5 h-5" />,
        warning: <FiAlertTriangle className="w-5 h-5" />,
    };

    const styles = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    };

    return (
        <div
            className={clsx(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right pointer-events-auto',
                styles[toast.type]
            )}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="font-semibold text-sm mb-1">{toast.title}</p>
                )}
                <p className="text-sm">{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
                <FiX className="w-4 h-4" />
            </button>
        </div>
    );
}
