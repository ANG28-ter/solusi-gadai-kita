import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Loan } from '@/lib/types';
import { FiAlertTriangle } from 'react-icons/fi';
import { FaGavel } from 'react-icons/fa';

interface AddDecisionModalProps {
    loan: Loan;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddDecisionModal({ loan, isOpen, onClose, onSuccess }: AddDecisionModalProps) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!note.trim()) {
            toast.error('Catatan harus diisi');
            return;
        }

        try {
            setSubmitting(true);
            // Always send 'AUCTION' as it is now the only option
            await api.post(`/loans/${loan.id}/decisions`, {
                decision: 'AUCTION',
                note: note.trim(),
            });
            toast.success('Keputusan Lelang berhasil dibuat');
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Error adding decision:', error);
            toast.error('Gagal menambahkan keputusan', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        setNote('');
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Keputusan Lelang" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Warning Banner */}
                <div className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30 text-center">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                        <FaGavel className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Konfirmasi Lelang
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        Anda akan menandai gadai <strong>{loan.code}</strong> untuk proses lelang. Barang jaminan akan masuk daftar siap jual.
                    </p>
                </div>

                {/* Alert Info */}
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                    <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                        <p className="font-medium mb-1">Perhatian:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                            <li>Status gadai akan tetap OVERDUE sampai barang terjual atau dilunasi.</li>
                            <li>Nasabah masih bisa melunasi selama barang belum terjual.</li>
                        </ul>
                    </div>
                </div>

                {/* Note Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alasan Lelang <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Contoh: Nasabah tidak bisa dihubungi dan sudah lewat jatuh tempo..."
                        required
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-3 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-orange-500 focus:ring-orange-500"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={submitting}
                        fullWidth
                        className="h-12"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !note.trim()}
                        fullWidth
                        className="h-12 bg-orange-600 hover:bg-orange-700 text-white border-transparent focus:ring-orange-500"
                    >
                        {submitting ? 'Memproses...' : 'Ya, Putuskan Lelang'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
