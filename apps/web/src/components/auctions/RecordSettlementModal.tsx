"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface RecordSettlementModalProps {
    auctionId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RecordSettlementModal({ auctionId, isOpen, onClose, onSuccess }: RecordSettlementModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [grossAmountRp, setGrossAmountRp] = useState('');
    const [feesRp, setFeesRp] = useState('0');
    const [settledAt, setSettledAt] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const grossAmount = parseInt(grossAmountRp.replace(/\D/g, '')) || 0;
    const fees = parseInt(feesRp.replace(/\D/g, '')) || 0;
    const netAmount = grossAmount - fees;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (grossAmount <= 0) {
            toast.error('Harga jual harus lebih dari 0');
            return;
        }

        if (fees < 0) {
            toast.error('Biaya tidak boleh negatif');
            return;
        }

        if (netAmount <= 0) {
            toast.error('Jumlah bersih harus lebih dari 0');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/auctions/${auctionId}/settlements`, {
                grossAmountRp: grossAmount,
                feesRp: fees,
                settledAt,
                note: note.trim() || undefined,
            });

            toast.success('Settlement berhasil dicatat');
            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Error recording:', error);
            toast.error('Gagal mencatat', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setGrossAmountRp('');
        setFeesRp('0');
        setSettledAt(new Date().toISOString().split('T')[0]);
        setNote('');
    }

    function handleClose() {
        if (!loading) {
            resetForm();
            onClose();
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Catat Laporan Lelang" size="lg">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Gross Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Harga Jual <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={grossAmountRp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setGrossAmountRp(value ? parseInt(value).toLocaleString('id-ID') : '');
                            }}
                            placeholder="Masukan jumlah Rupiah"
                            required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Total harga jual barang lelang
                        </p>
                    </div>

                    {/* Fees */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Biaya Lelang
                        </label>
                        <Input
                            type="text"
                            value={feesRp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setFeesRp(value ? parseInt(value).toLocaleString('id-ID') : '');
                            }}
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Biaya administrasi/komisi lelang (default: 0)
                        </p>
                    </div>

                    {/* Net Amount (Calculated) */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Jumlah Bersih (akan masuk kas):
                            </span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(netAmount)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            = Harga Jual - Biaya Lelang
                        </p>
                    </div>

                    {/* Settled Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Terima Uang <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={settledAt}
                            onChange={(e) => setSettledAt(e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Catatan
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-gray-100"
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Catatan tambahan (opsional)"
                        />
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            💡 Otomatis membuat kas masuk sebesar jumlah bersih.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || grossAmount <= 0 || netAmount <= 0}
                    >
                        {loading ? 'Menyimpan...' : 'Catat'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
