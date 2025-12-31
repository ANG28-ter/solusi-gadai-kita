'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface PaymentDetail {
    id: string;
    amountRp: number;
    paidAt: string;
    note?: string;
    loan: {
        id: string;
        code: string;
        principalRp: number;
        customer: { fullName: string; address?: string };
        branch?: { name: string; address?: string; phone?: string };
    };
    user: { fullName: string; username: string };
    principalRecordedRp?: number;
    interestRecordedRp?: number;
    daysUsedSnapshot?: number;
}

export default function PaymentPrintPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const id = params?.id as string;
    // Check for search params
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const autoPrint = searchParams ? searchParams.get('autoprint') === 'true' : false;

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    useEffect(() => {
        if (!loading && payment && autoPrint) {
            // Small delay to ensure rendering is complete
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, payment, autoPrint]);

    async function loadData() {
        try {
            setLoading(true);
            const res = await api.get(`/payments/${id}`);
            // Note: backend findById includes loan.customer and user. 
            // Depending on backend, branch might be included or in context. 
            // For now assuming basic info is present.
            setPayment(res.data);
        } catch (error) {
            console.error('Error loading payment:', error);
            toast.error('Gagal memuat detail pembayaran', 'Error');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !payment) {
        return <PageLoader message="siapkan lembar cetak..." />;
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                @media screen {
                    .print-container {
                        max-width: 21cm;
                        margin: 2rem auto;
                        background: white;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        padding: 2cm;
                    }
                    body {
                        background: #f3f4f6;
                    }
                }
                .print-container {
                     font-family: 'Times New Roman', Times, serif; 
                     /* Using Times or Arial as per 'formal' request. The report example used Arial. */
                     font-family: Arial, sans-serif;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 8px;
                    vertical-align: top;
                }
            `}</style>

            {/* Action Bar */}
            <div className="no-print sticky top-0 bg-gray-900 text-white p-4 flex items-center justify-between shadow-md z-50">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                >
                    ← Kembali
                </button>
                <div className="text-center">
                    <h1 className="font-bold">Preview Cetak Kuitansi</h1>
                    <p className="text-xs opacity-75">{payment.loan.code}</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <span>🖨️ Cetak</span>
                </button>
            </div>

            {/* Document Content */}
            <div className="print-container bg-white text-black text-sm">

                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-6 text-center">
                    <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
                        BUKTI PEMBAYARAN ANGSURAN
                    </h1>
                    <h2 className="text-lg font-bold">
                        {payment.loan.branch?.name || 'SOLUSI GADAI KITA'}
                    </h2>
                    <p className="text-xs mt-1">
                        {payment.loan.branch?.address || 'Jl. Contoh No. 123'} - {formatDate(payment.paidAt)}
                    </p>
                </div>

                {/* Info Grid */}
                <div className="mb-6">
                    <table className="text-sm">
                        <tbody>
                            <tr>
                                <td className="w-32 font-bold">No. Transaksi</td>
                                <td>: {payment.id.slice(0, 8).toUpperCase()}</td>
                                <td className="w-32 font-bold">Kode Gadai</td>
                                <td>: {payment.loan.code}</td>
                            </tr>
                            <tr>
                                <td className="font-bold">Tanggal Bayar</td>
                                <td>: {formatDate(payment.paidAt)}</td>
                                <td className="font-bold">Nasabah</td>
                                <td>: {payment.loan.customer.fullName}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount Box */}
                <div className="border-2 border-black p-4 mb-6">
                    <p className="mb-2 font-bold text-base border-b border-gray-300 pb-2">Rincian Pembayaran</p>
                    <table className="text-sm">
                        <tbody>
                            <tr>
                                <td className="py-1">Bayar Pokok</td>
                                <td className="text-right font-mono">{formatCurrency(payment.principalRecordedRp || 0)}</td>
                            </tr>
                            <tr>
                                <td className="py-1">Bayar Bunga / Jasa</td>
                                <td className="text-right font-mono">{formatCurrency(payment.interestRecordedRp || 0)}</td>
                            </tr>
                            <tr className="border-t border-black font-bold text-lg">
                                <td className="pt-2">TOTAL DIBAYAR</td>
                                <td className="pt-2 text-right">
                                    {formatCurrency(payment.amountRp)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Snapshot Info */}
                <div className="mb-6 bg-gray-50 border border-gray-200 p-3 text-xs">
                    <h4 className="font-bold mb-2">Informasi Tambahan:</h4>
                    <p>Lama pinjaman: {payment.daysUsedSnapshot || 0} hari</p>
                    <p>Catatan: {payment.note || '-'}</p>
                </div>

                {/* Signatures */}
                <div className="mt-12">
                    <table className="text-center w-full">
                        <tbody>
                            <tr>
                                <td>
                                    <p className="mb-16">Penyetor</p>
                                    <p className="font-bold border-t border-black inline-block px-8 pt-1">
                                        {payment.loan.customer.fullName}
                                    </p>
                                </td>
                                <td>
                                    <p className="mb-16">Diterima Oleh</p>
                                    <p className="font-bold border-t border-black inline-block px-8 pt-1">
                                        {user?.fullName || 'Admin'}
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-[10px] text-gray-500 italic">
                    <p>Dokumen ini dicetak otomatis oleh sistem pada {new Date().toLocaleString('id-ID')}</p>
                    <p>Solusi Gadai Kita - Aman, Cepat, Terpercaya</p>
                </div>

            </div>
        </>
    );
}
