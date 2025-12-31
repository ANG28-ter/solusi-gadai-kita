import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'success' | 'warning'; // warning mapped to danger/primary?
    loading?: boolean;
    icon?: React.ReactNode;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    variant = "primary",
    loading = false,
    icon
}: ConfirmationModalProps) {

    // Determine button variant
    const buttonVariant = variant === 'warning' ? 'danger' : variant;

    // Default icons
    const renderIcon = () => {
        if (icon) return icon;
        if (variant === 'danger' || variant === 'warning') {
            return <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full"><FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" /></div>;
        }
        if (variant === 'success') {
            return <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full"><FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" /></div>;
        }
        return <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full"><FiInfo className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="flex flex-col items-center text-center space-y-4">
                {renderIcon()}

                <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300">
                        {message}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 w-full pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={buttonVariant}
                        onClick={() => {
                            onConfirm();
                            // Optional: onClose(); depends on parent logic
                        }}
                        loading={loading}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
