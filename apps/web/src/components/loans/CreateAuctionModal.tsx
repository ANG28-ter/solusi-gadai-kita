"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface CreateAuctionModalProps {
    loanCode: string;
    remainingAmount: number;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isCreating: boolean;
}

export function CreateAuctionModal({
    loanCode,
    remainingAmount,
    isOpen,
    onClose,
    onConfirm,
    isCreating
}: CreateAuctionModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buat Lelang">
            <div className="space-y-4">
                {/* Warning */}
                <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        ⚠️ Anda akan membuat lelang untuk gadai <strong>{loanCode}</strong>
                    </p>
                </div>

                {/* Info */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sisa Hutang:</span>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(remainingAmount)}
                        </span>
                    </div>
                </div>

                {/* Requirements */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        💡 Lelang hanya dapat dibuat jika gadai dalam status OVERDUE dan memiliki keputusan AUCTION.
                    </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Setelah lelang dibuat, Anda akan langsung diarahkan ke halaman detail lelang.
                </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isCreating}
                >
                    Batal
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={isCreating}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    {isCreating ? 'Membuat Lelang...' : 'Buat Lelang'}
                </Button>
            </div>
        </Modal>
    );
}
