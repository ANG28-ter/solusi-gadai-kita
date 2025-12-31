"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FiAlertTriangle, FiRotateCcw } from 'react-icons/fi';

interface ReversePaymentModalProps {
    payment: Payment;
    loanId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReversePaymentModal({ payment, loanId, isOpen, onClose, onSuccess }: ReversePaymentModalProps) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [reason, setReason] = useState('');

    async function handleReverse() {
        if (!reason || reason.trim().length < 5) {
            toast.error('Alasan harus diisi minimal 5 karakter');
            return;
        }

        try {
            setSubmitting(true);
            // Correct endpoint: /payments/:id/reverse
            await api.post(`/payments/${payment.id}/reverse`, {
                reason: reason.trim(),
            });
            toast.success('Pembayaran berhasil dibatalkan');
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Error reversing payment:', error);
            toast.error('Gagal membatalkan pembayaran', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        setReason('');
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Batalkan Pembayaran" size="md">
            <div className="space-y-6">
                {/* Warning */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                Peringatan Penting
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Pembatalan pembayaran akan <strong>mengembalikan saldo pinjaman</strong> dan membuat
                                transaksi kas terbalik. Pastikan alasan pembatalan valid.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Detail Pembayaran yang Akan Dibatalkan
                    </h4>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">Tanggal:</dt>
                            <dd className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(payment.paidAt)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">Jumlah:</dt>
                            <dd className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(payment.amountRp)}
                            </dd>
                        </div>
                        {payment.note && (
                            <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Catatan:</dt>
                                <dd className="text-gray-900 dark:text-gray-100">{payment.note}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Reason Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alasan Pembatalan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: Pembayaran double entry, salah input jumlah, dll"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 placeholder-gray-400 dark:placeholder-gray-500"
                        required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Minimal 5 karakter. Alasan akan dicatat untuk audit trail.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleReverse}
                        disabled={!reason || reason.trim().length < 5 || submitting}
                        variant="danger"
                        leftIcon={<FiRotateCcw />}
                        fullWidth
                    >
                        {submitting ? 'Memproses...' : 'Batalkan Pembayaran'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={submitting}
                        fullWidth
                    >
                        Batal
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
