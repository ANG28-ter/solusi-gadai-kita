'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FiArrowLeft, FiPrinter, FiCalendar, FiUser, FiInfo, FiCreditCard } from 'react-icons/fi';
import { useToast } from '@/components/ui/Toast';

interface PaymentDetail {
    id: string;
    amountRp: number;
    paidAt: string;
    note?: string;

    // Relations
    loan: {
        id: string;
        code: string;
        customer: { fullName: string };
    };
    user: { fullName: string };
    cashLedger?: { status: string };

    // Snapshots
    daysUsedSnapshot?: number;
    interestRateSnapshotBps?: number;
    interestAmountSnapshotRp?: number;
    totalDueSnapshotRp?: number;
    interestRecordedRp?: number;
    principalRecordedRp?: number;
}

export default function PaymentDetail({ params }: { params: { id: string } }) {
    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const toast = useToast();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        try {
            setLoading(true);
            const res = await api.get(`/payments/${params.id}`);
            setPayment(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat detail pembayaran', 'Error');
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => {
        if (payment && iframeRef.current) {
            // Add timestamp to force reload and trigger onLoad event
            // Add autoprint=true to tell the child page to print when ready
            iframeRef.current.src = `/payments/${payment.id}/print?autoprint=true&t=${Date.now()}`;
        }
    };

    if (loading) return <AppLayout><PageLoader message="Memuat detail pembayaran..." /></AppLayout>;
    if (!payment) return <AppLayout><div className="p-8 text-center">Data tidak ditemukan</div></AppLayout>;

    return (
        <AppLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Hidden Print Iframe */}
                <iframe
                    ref={iframeRef}
                    className="hidden"
                    title="Print Receipt"
                />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <FiArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Detail Pembayaran
                            </h1>
                            <p className="text-gray-500 text-sm">{payment.id}</p>
                        </div>
                    </div>

                    <Button variant="secondary" leftIcon={<FiPrinter />} onClick={handlePrint}>
                        Cetak Transaksi
                    </Button>
                </div>

                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* General Info */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <FiInfo className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Informasi Umum</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-gray-500">Tanggal Bayar</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(payment.paidAt)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-gray-500">Jumlah Diterima</span>
                                <span className="font-bold text-success text-lg">{formatCurrency(payment.amountRp)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-gray-500">Diterima Oleh</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{payment.user.fullName}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-gray-500">Kode Gadai</span>
                                <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => router.push(`/loans/${payment.loan.id}`)}>
                                    {payment.loan.code}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Nasabah</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{payment.loan.customer.fullName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Allocation Info (Snapshot) */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-success/10 rounded-xl">
                                <FiCreditCard className="w-5 h-5 text-success" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Alokasi & Snapshot</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl space-y-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alokasi Pembayaran</p>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Bayar Pokok</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(payment.principalRecordedRp ?? 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Bayar Bunga</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(payment.interestRecordedRp ?? 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kondisi Saat Bayar</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Hari Terpakai</span>
                                    <span className="font-medium">{payment.daysUsedSnapshot ?? '-'} hari</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Bunga Berjalan</span>
                                    <span className="font-medium">{formatCurrency(payment.interestAmountSnapshotRp ?? 0)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Tagihan Saat Itu</span>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(payment.totalDueSnapshotRp ?? 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {payment.note && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-amber-800 dark:text-amber-200 text-sm">
                        <span className="font-bold">Catatan:</span> {payment.note}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
