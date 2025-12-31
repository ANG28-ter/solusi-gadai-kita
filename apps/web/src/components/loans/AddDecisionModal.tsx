import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Loan } from '@/lib/types';
import { FiAlertCircle } from 'react-icons/fi';

interface AddDecisionModalProps {
    loan: Loan;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type DecisionType = 'AUCTION' | 'HOLD';

export function AddDecisionModal({ loan, isOpen, onClose, onSuccess }: AddDecisionModalProps) {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [decisionType, setDecisionType] = useState<DecisionType>('AUCTION');
    const [note, setNote] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!note.trim()) {
            toast.error('Catatan harus diisi');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/loans/${loan.id}/decisions`, {
                decision: decisionType,
                note: note.trim(),
            });
            toast.success('Keputusan berhasil ditambahkan');
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
        setDecisionType('AUCTION');
        setNote('');
        onClose();
    }

    const decisionInfo = {
        AUCTION: {
            label: '🔨 Lelang (Auction)',
            description: 'Menandai loan untuk proses lelang. Barang jaminan akan dijual lelang.',
            impact: [
                'Loan ditandai untuk proses lelang',
                'Tidak memblokir pembayaran',
                'Tercatat di timeline audit',
            ],
        },
        HOLD: {
            label: '⏸️ Tahan (Hold)',
            description: 'Menahan loan untuk review lebih lanjut.',
            impact: [
                'Loan ditandai untuk review',
                'Memerlukan keputusan lanjutan',
                'Tercatat di timeline audit',
            ],
        },
    };

    const selectedInfo = decisionInfo[decisionType];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Keputusan" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Loan Info */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gadai:</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {loan.code} - {loan.customer?.fullName}
                    </p>
                </div>

                {/* Decision Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Jenis Keputusan <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        {(Object.keys(decisionInfo) as DecisionType[]).map((type) => (
                            <label
                                key={type}
                                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${decisionType === type
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="decisionType"
                                    value={type}
                                    checked={decisionType === type}
                                    onChange={(e) => setDecisionType(e.target.value as DecisionType)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {decisionInfo[type].label}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {decisionInfo[type].description}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Impact Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                Dampak Keputusan "{selectedInfo.label}"
                            </h4>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                {selectedInfo.impact.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Catatan / Alasan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        placeholder="Jelaskan alasan keputusan ini..."
                        required
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Catatan ini akan tercatat di timeline audit
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        type="submit"
                        disabled={submitting || !note.trim()}
                        fullWidth
                    >
                        {submitting ? 'Menyimpan...' : 'Tambah Keputusan'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={submitting}
                        fullWidth
                    >
                        Batal
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
