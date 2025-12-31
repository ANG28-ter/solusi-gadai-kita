"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { TransactionReportResult, SubmitReportPayload } from '@/lib/types/report-submission';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiFileText, FiDollarSign, FiSend } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function TransactionReportPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [report, setReport] = useState<TransactionReportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [physicalCash, setPhysicalCash] = useState('');
    const [submitNote, setSubmitNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();
    const router = useRouter();

    async function generateReport() {
        if (!startDate || !endDate) {
            toast.error('Tanggal awal dan akhir wajib diisi');
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams({
                startDate,
                endDate,
                includeExpenses: 'true',
            });

            const response = await api.get<TransactionReportResult>(`/reports/transactions?${params.toString()}`);
            setReport(response.data);
            toast.success('Laporan berhasil dibuat');
        } catch (error: any) {
            console.error('Error generating report:', error);
            toast.error(error.response?.data?.message || 'Gagal membuat laporan');
        } finally {
            setLoading(false);
        }
    }

    async function submitReport() {
        if (!report) return;

        const physicalCashRp = parseInt(physicalCash.replace(/\D/g, ''));
        if (isNaN(physicalCashRp) || physicalCashRp < 0) {
            toast.error('Kas fisik tidak valid');
            return;
        }

        try {
            setSubmitting(true);
            const payload: SubmitReportPayload = {
                periodStart: startDate,
                periodEnd: endDate,
                reportData: report,
                physicalCashRp,
                note: submitNote || undefined,
            };

            await api.post('/reports/submissions', payload);
            toast.success('Laporan berhasil disetor!');
            setShowSubmitModal(false);
            router.push('/reports/submissions');
        } catch (error: any) {
            console.error('Error submitting report:', error);
            toast.error(error.response?.data?.message || 'Gagal menyetor laporan');
        } finally {
            setSubmitting(false);
        }
    }

    const discrepancy = report && physicalCash
        ? parseInt(physicalCash.replace(/\D/g, '')) - report.summary.saldoRp
        : 0;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Laporan Transaksi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate dan setor laporan transaksi harian
                    </p>
                </div>

                {/* Date Range Picker */}
                <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tanggal Mulai
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tanggal Akhir
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={generateReport}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Generating...' : 'Generate Laporan'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Report Results */}
                {report && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-success/10 rounded-2xl">
                                        <FiDollarSign className="w-6 h-6 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pemasukan</p>
                                        <p className="text-2xl font-bold text-success">
                                            {formatCurrency(report.summary.totalPemasukanRp)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-danger/10 rounded-2xl">
                                        <FiDollarSign className="w-6 h-6 text-danger" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
                                        <p className="text-2xl font-bold text-danger">
                                            {formatCurrency(report.summary.totalPengeluaranRp)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <FiDollarSign className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {formatCurrency(report.summary.saldoRp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Table */}
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Detail Transaksi
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pemasukan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pengeluaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {report.data.map((row) => (
                                            <tr key={row.no} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{row.no}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(row.date)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {row.name.replace('Reversal Payment', 'Pembatalan Pembayaran').replace('Payment Loan', 'Pembayaran Gadai')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-success">
                                                    {row.pemasukanRp > 0 ? formatCurrency(row.pemasukanRp) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-danger">
                                                    {row.pengeluaranRp > 0 ? formatCurrency(row.pengeluaranRp) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={() => setShowSubmitModal(true)}
                                className="flex items-center gap-2"
                            >
                                <FiSend className="w-5 h-5" />
                                Setor Laporan ke Manager
                            </Button>
                        </div>
                    </>
                )}

                {/* Submission Modal */}
                {showSubmitModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-xl max-w-md w-full p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                Setor Laporan
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Periode Laporan
                                    </label>
                                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                                        {formatDate(startDate)} - {formatDate(endDate)}
                                    </p>
                                </div>

                                <div className="p-4 bg-primary/5 rounded-2xl">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Sistem</p>
                                    <p className="text-xl font-bold text-primary">
                                        {report && formatCurrency(report.summary.saldoRp)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Kas Fisik (Rp)
                                    </label>
                                    <Input
                                        type="text"
                                        value={physicalCash}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setPhysicalCash(value ? parseInt(value).toLocaleString('id-ID') : '');
                                        }}
                                        placeholder="Masukkan jumlah kas fisik"
                                    />
                                </div>

                                {physicalCash && (
                                    <div className={`p-4 rounded-2xl ${Math.abs(discrepancy) < 1000
                                        ? 'bg-success/10'
                                        : 'bg-warning/10'
                                        }`}>
                                        <p className="text-sm font-medium">Selisih</p>
                                        <p className={`text-lg font-bold ${Math.abs(discrepancy) < 1000
                                            ? 'text-success'
                                            : 'text-warning'
                                            }`}>
                                            {discrepancy >= 0 ? '+' : ''}{formatCurrency(discrepancy)}
                                            {Math.abs(discrepancy) < 1000 && ' ✓ Match!'}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Catatan (Opsional)
                                    </label>
                                    <textarea
                                        value={submitNote}
                                        onChange={(e) => setSubmitNote(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100"
                                        placeholder="Tambahkan catatan jika ada"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => setShowSubmitModal(false)}
                                    variant="ghost"
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={submitReport}
                                    className="flex-1"
                                    disabled={submitting || !physicalCash}
                                >
                                    {submitting ? 'Menyetor...' : 'Setor Laporan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
