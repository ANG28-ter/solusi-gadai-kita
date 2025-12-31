import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    message?: string;
    confirmKeyword?: string;
    loading?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    message = "Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus secara permanen.",
    confirmKeyword = "HAPUS",
    loading = false,
}: DeleteConfirmationModalProps) {
    const [inputValue, setInputValue] = useState('');

    // Reset input when modal opens
    useEffect(() => {
        if (isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (inputValue === confirmKeyword) {
            onConfirm();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Konfirmasi Hapus"
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 flex gap-4 items-start">
                    <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full flex-shrink-0">
                        <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-200" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-100">
                            Hapus "{itemName}"?
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-200">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ketik <strong>{confirmKeyword}</strong> untuk melanjutkan:
                    </label>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Ketik ${confirmKeyword}`}
                        className="w-full font-mono uppercase"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={inputValue !== confirmKeyword || loading}
                        loading={loading}
                        leftIcon={<FiAlertTriangle className="w-4 h-4" />}
                    >
                        Hapus Permanen
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
