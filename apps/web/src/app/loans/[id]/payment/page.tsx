"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { Loan } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculatePaymentAllocation } from '@/lib/loan-utils';
import { FiArrowLeft, FiDollarSign, FiSave, FiTrendingUp, FiCheck } from 'react-icons/fi';
import Link from 'next/link';

export default function PaymentRecordingPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [remaining, setRemaining] = useState<any>(null);

    // Form state
    const [amountRp, setAmountRp] = useState('');
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    useEffect(() => {
        loadLoanData();
    }, [params.id]);

    async function loadLoanData() {
        try {
            setLoading(true);

            // Get loan from list and filter
            const response = await api.get('/loans');
            let allLoans = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            const loanData = allLoans.find((l: Loan) => l.id === params.id);

            if (!loanData) {
                throw new Error('Loan not found');
            }

            setLoan(loanData);

            // Get remaining balance for breakdown
            if (loanData.status === 'ACTIVE' || loanData.status === 'OVERDUE') {
                try {
                    const remainingRes = await api.get(`/loans/${params.id}/remaining`);
                    setRemaining(remainingRes.data);
                } catch (err) {
                    console.log('Could not fetch remaining balance:', err);
                }
            }
        } catch (error: any) {
            console.error('Error loading loan:', error);
            toast.error('Gagal memuat data gadai', error.response?.data?.message || error.message);
            router.push('/loans');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!loan) return;

        // Validation
        const amount = parseInt(amountRp.replace(/\D/g, ''));
        if (!amount || amount <= 0) {
            toast.error('Jumlah pembayaran harus lebih dari 0');
            return;
        }

        try {
            setSubmitting(true);

            await api.post('/payments', {
                loanId: loan.id,
                amountRp: amount,
                paidAt: paidAt,
                note: note.trim() || undefined,
            });

            toast.success('Pembayaran berhasil dicatat');
            router.push(`/loans/${loan.id}`);
        } catch (error: any) {
            console.error('Error recording payment:', error);
            toast.error('Gagal mencatat pembayaran', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    // Format currency input
    function handleAmountChange(value: string) {
        const numbers = value.replace(/\D/g, '');
        setAmountRp(numbers);
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data gadai..." />
            </AppLayout>
        );
    }

    if (!loan) {
        return null;
    }

    const formattedAmount = amountRp ? parseInt(amountRp).toLocaleString('id-ID') : '';

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Catat Pembayaran
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {loan.code} - {loan.customer?.fullName}
                        </p>
                    </div>
                </div>

                {/* Loan Summary with Interest */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Informasi Gadai</h2>
                    </CardHeader>
                    <CardBody>
                        {remaining ? (
                            <div className="space-y-4">
                                {/* Remaining Balance */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                                        Sisa Yang Harus Dibayar:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">Sisa Bunga:</span>
                                            <span className="font-semibold">{formatCurrency(remaining.remaining.interestRp)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">Sisa Pokok:</span>
                                            <span className="font-semibold">{formatCurrency(remaining.remaining.principalRp)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-blue-300 dark:border-blue-700">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-blue-900 dark:text-blue-100">Total Sisa:</span>
                                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(remaining.remaining.totalRp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            ✓ Sudah dibayar: {formatCurrency(remaining.paid.totalRp)}
                                        </p>
                                    </div>
                                </div>

                                {/* Other Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {formatDate(loan.startDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {formatDate(loan.dueDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {loan.status}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sudah Dibayar</p>
                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(remaining.paid.totalRp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pokok Pinjaman</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(loan.principalRp)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {formatDate(loan.startDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {formatDate(loan.dueDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {loan.status}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Payment Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FiDollarSign className="w-5 h-5" />
                                Form Pembayaran
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-6">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Jumlah Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                            Rp
                                        </span>
                                        <Input
                                            type="text"
                                            value={formattedAmount}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            placeholder="0"
                                            className="pl-12"
                                            required
                                            fullWidth
                                        />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Masukkan jumlah yang dibayarkan oleh nasabah
                                    </p>
                                </div>

                                {/* Date (auto-filled to today) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tanggal Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={paidAt}
                                        onChange={(e) => setPaidAt(e.target.value)}
                                        required
                                        fullWidth
                                    />
                                </div>

                                {/* Note (optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Catatan
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        placeholder="Tambahkan catatan jika diperlukan..."
                                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
                                    />
                                </div>

                                {/* Payment Breakdown Preview */}
                                {remaining && amountRp && parseInt(amountRp) > 0 && (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                                            <FiTrendingUp className="w-5 h-5" />
                                            Breakdown Pembayaran
                                        </h3>

                                        {(() => {
                                            const amount = parseInt(amountRp);
                                            const allocation = calculatePaymentAllocation(
                                                amount,
                                                remaining.remaining.interestRp,
                                                remaining.remaining.principalRp
                                            );

                                            return (
                                                <div className="space-y-4">
                                                    {/* Current Balance */}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saldo Saat Ini:</p>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                                                                <p className="text-gray-600 dark:text-gray-400 text-xs">Bunga:</p>
                                                                <p className="font-semibold">{formatCurrency(remaining.remaining.interestRp)}</p>
                                                            </div>
                                                            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                                                                <p className="text-gray-600 dark:text-gray-400 text-xs">Pokok:</p>
                                                                <p className="font-semibold">{formatCurrency(remaining.remaining.principalRp)}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Payment Allocation */}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alokasi Pembayaran:</p>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                    <span className="text-sm text-green-900 dark:text-green-100">Ke Bunga:</span>
                                                                </div>
                                                                <span className="font-bold text-green-700 dark:text-green-300">
                                                                    {formatCurrency(allocation.interestPaid)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                    <span className="text-sm text-green-900 dark:text-green-100">Ke Pokok:</span>
                                                                </div>
                                                                <span className="font-bold text-green-700 dark:text-green-300">
                                                                    {formatCurrency(allocation.principalPaid)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* After Payment */}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Setelah Pembayaran:</p>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-2">
                                                                <p className="text-orange-600 dark:text-orange-400 text-xs">Sisa Bunga:</p>
                                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                                    {formatCurrency(allocation.remainingInterest)}
                                                                </p>
                                                            </div>
                                                            <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-2">
                                                                <p className="text-orange-600 dark:text-orange-400 text-xs">Sisa Pokok:</p>
                                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                                    {formatCurrency(allocation.remainingPrincipal)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Total Sisa:</span>
                                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                                    {formatCurrency(allocation.remainingInterest + allocation.remainingPrincipal)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Info Note */}
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded p-2">
                                                        💡 <strong>Catatan:</strong> Pembayaran dialokasikan ke bunga terlebih dahulu, sisa ke pokok pinjaman.
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        leftIcon={<FiSave />}
                                        disabled={submitting}
                                        fullWidth
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                                    </Button>
                                    <Link href={`/loans/${loan.id}`} className="flex-1">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="lg"
                                            disabled={submitting}
                                            fullWidth
                                        >
                                            Batal
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </form>

                {/* Help Text */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Catatan:</strong> Pembayaran yang sudah dicatat bersifat immutable (tidak bisa diedit).
                        Pastikan data sudah benar sebelum menyimpan. Jika terjadi kesalahan, dapat dilakukan reversal.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
