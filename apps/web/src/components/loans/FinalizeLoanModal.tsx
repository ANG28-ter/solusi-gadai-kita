import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Loan } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { FiAlertTriangle, FiLock } from 'react-icons/fi';

interface FinalizeLoanModalProps {
    loan: Loan;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function FinalizeLoanModal({ loan, isOpen, onClose, onSuccess }: FinalizeLoanModalProps) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [calculation, setCalculation] = useState<any>(null);
    const [loadingCalc, setLoadingCalc] = useState(false);

    // Fetch calculation when modal opens
    React.useEffect(() => {
        if (isOpen && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE')) {
            fetchCalculation();
        }
    }, [isOpen, loan.id]);

    async function fetchCalculation() {
        try {
            setLoadingCalc(true);
            const response = await api.get(`/loans/${loan.id}/remaining`);
            setCalculation(response.data);
        } catch (error) {
            console.error('Error fetching calculation:', error);
        } finally {
            setLoadingCalc(false);
        }
    }

    async function handleFinalize() {
        if (!confirmed) {
            toast.error('Harap centang konfirmasi terlebih dahulu');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/contracts/loans/${loan.id}/finalize`);
            toast.success('Gadai berhasil di-finalize');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error finalizing loan:', error);
            toast.error('Gagal finalize gadai', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        setConfirmed(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Finalize Gadai" size="md">
            <div className="space-y-6">
                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                Peringatan Penting
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Setelah disahkan, kalkulasi bunga dan total hutang akan <strong>dikunci</strong> dan tidak bisa diubah lagi.
                                Pastikan data sudah benar sebelum melanjutkan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calculation Preview */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <FiLock className="w-4 h-4" />
                        Preview Kalkulasi yang Akan Dikunci
                    </h4>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">Pokok Pinjaman:</dt>
                            <dd className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(loan.principalRp)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">Tanggal Mulai:</dt>
                            <dd>{new Date(loan.startDate).toLocaleDateString('id-ID')}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600 dark:text-gray-400">Jatuh Tempo:</dt>
                            <dd>{new Date(loan.dueDate).toLocaleDateString('id-ID')}</dd>
                        </div>
                        {loan.adminFeeRp > 0 && (
                            <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Biaya Admin:</dt>
                                <dd>{formatCurrency(loan.adminFeeRp)}</dd>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                * Interest rate akan dihitung berdasarkan policy sistem saat ini
                            </p>
                        </div>
                    </dl>
                </div>

                {/* Live Calculation Preview */}
                {loadingCalc ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Memuat data...</p>
                    </div>
                ) : calculation ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                            <FiLock className="w-4 h-4" />
                            Data Yang Akan Dikunci
                        </h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-700 dark:text-gray-300">Pokok Pinjaman:</dt>
                                <dd className="font-semibold">{formatCurrency(calculation.principalRp)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-700 dark:text-gray-300">Tenor:</dt>
                                <dd className="font-semibold">
                                    {Math.ceil((new Date(loan.dueDate).getTime() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24))} hari
                                </dd>
                            </div>
                            <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                    Kontrak akan dibuat dengan data ini. Tidak bisa diubah setelah disahkan.
                                </p>
                            </div>
                        </dl>
                    </div>
                ) : null}

                {/* Confirmation Checkbox */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="confirm-finalize"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="confirm-finalize" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Saya mengerti bahwa kalkulasi akan dikunci dan tidak bisa diubah setelah disahkan
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleFinalize}
                        disabled={!confirmed || submitting}
                        fullWidth
                    >
                        {submitting ? 'Memproses...' : 'Sahkan Sekarang'}
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
