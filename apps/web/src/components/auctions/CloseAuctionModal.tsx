"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

type AuctionStatus = 'SOLD' | 'CANCELLED';

interface CloseAuctionModalProps {
    auctionId: string;
    loanCode: string;
    status: AuctionStatus;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CloseAuctionModal({
    auctionId,
    loanCode,
    status,
    isOpen,
    onClose,
    onSuccess
}: CloseAuctionModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');

    const isSold = status === 'SOLD';
    const title = isSold ? 'Tutup Lelang sebagai TERJUAL' : 'Batalkan Lelang';
    const warningText = isSold
        ? `Gadai ${loanCode} akan ditandai sebagai CLOSED (selesai).`
        : `Gadai ${loanCode} akan tetap dalam status Jatuh tempo.`;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validation for CANCELLED
        if (!isSold && note.trim().length < 10) {
            toast.error('Alasan pembatalan minimal 10 karakter');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/auctions/${auctionId}/close`, {
                status,
                note: note.trim() || undefined,
            });

            toast.success(`Lelang berhasil ${isSold ? 'ditutup sebagai TERJUAL' : 'dibatalkan'}`);
            onSuccess();
            onClose();
            setNote('');
        } catch (error: any) {
            console.error('Error closing auction:', error);
            toast.error('Gagal menutup lelang', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        if (!loading) {
            setNote('');
            onClose();
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Warning */}
                    <div className={`p-4 rounded-lg border ${isSold
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}>
                        <p className={`text-sm font-medium ${isSold
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-yellow-800 dark:text-yellow-300'
                            }`}>
                            ⚠️ {warningText}
                        </p>
                    </div>

                    {/* Notes/Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isSold ? 'Catatan (opsional)' : 'Alasan Pembatalan *'}
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-gray-100"
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={isSold ? 'Catatan tambahan...' : 'Minimal 10 karakter...'}
                            required={!isSold}
                            minLength={isSold ? undefined : 10}
                        />
                        {!isSold && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {note.trim().length}/10 karakter
                            </p>
                        )}
                    </div>

                    {isSold && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                💡 Setelah ditutup sebagai TERJUAL, Anda dapat mencatat Laporan untuk memasukkan uang ke kas.
                            </p>
                        </div>
                    )}
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
                        disabled={loading || (!isSold && note.trim().length < 10)}
                        className={isSold ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        {loading ? 'Memproses...' : (isSold ? 'Tutup sebagai TERJUAL' : 'Batalkan Lelang')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
