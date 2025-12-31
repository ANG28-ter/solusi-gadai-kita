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
import { Loan, CollateralItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { getAllInterestTiers } from '@/lib/loan-utils';
import { FiArrowLeft, FiSave, FiPercent, FiAlertTriangle } from 'react-icons/fi';
import Link from 'next/link';

export default function EditLoanPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loan, setLoan] = useState<Loan | null>(null);
    const [availableCollaterals, setAvailableCollaterals] = useState<CollateralItem[]>([]);

    // Form state
    const [principalRp, setPrincipalRp] = useState('');
    const [selectedCollateralIds, setSelectedCollateralIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [adminFeeRp, setAdminFeeRp] = useState('0');

    useEffect(() => {
        loadData();
    }, [params.id]);

    async function loadData() {
        try {
            setLoading(true);

            // Load loan
            const loansRes = await api.get('/loans');
            const allLoans = Array.isArray(loansRes.data) ? loansRes.data : (loansRes.data?.data || []);
            const loanData = allLoans.find((l: Loan) => l.id === params.id);

            if (!loanData) {
                throw new Error('Loan not found');
            }

            // Check if can edit
            if (loanData.finalizedAt) {
                toast.error('Loan sudah difinalize, tidak bisa diedit');
                router.push(`/loans/${params.id}`);
                return;
            }

            setLoan(loanData);

            // Pre-fill form
            setPrincipalRp(loanData.principalRp.toString());
            setStartDate(new Date(loanData.startDate).toISOString().split('T')[0]);
            setDueDate(new Date(loanData.dueDate).toISOString().split('T')[0]);
            setAdminFeeRp((loanData.adminFeeRp || 0).toString());

            if (loanData.collaterals) {
                setSelectedCollateralIds(loanData.collaterals.map((c: CollateralItem) => c.id));
            }

            // Load available collaterals (including current ones)
            const collateralsRes = await api.get('/collaterals/draft');
            let allCollaterals = Array.isArray(collateralsRes.data) ? collateralsRes.data : collateralsRes.data?.data || [];

            // Include current loan's collaterals + available ones
            const currentCollateralIds = loanData.collaterals?.map((c: CollateralItem) => c.id) || [];
            const filtered = allCollaterals.filter((c: CollateralItem) =>
                !c.loanId || currentCollateralIds.includes(c.id)
            );

            console.log('Debug collaterals:', {
                allCollaterals: allCollaterals.length,
                currentCollateralIds,
                filtered: filtered.length
            });

            setAvailableCollaterals(filtered);

        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data', error.response?.data?.message || error.message);
            router.push('/loans');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!loan) return;

        const principal = parseInt(principalRp.replace(/\D/g, ''));
        if (!principal || principal <= 0) {
            toast.error('Jumlah pinjaman harus lebih dari 0');
            return;
        }

        if (selectedCollateralIds.length === 0) {
            toast.error('Pilih minimal 1 barang jaminan');
            return;
        }

        try {
            setSubmitting(true);

            await api.patch(`/loans/${loan.id}`, {
                principalRp: principal,
                collateralIds: selectedCollateralIds,
                startDate,
                dueDate,
                adminFeeRp: parseInt(adminFeeRp.replace(/\D/g, '')) || 0,
            });

            toast.success('Gadai berhasil diupdate');
            router.push(`/loans/${loan.id}`);

        } catch (error: any) {
            console.error('Error updating loan:', error);
            toast.error('Gagal update gadai', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
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

    const principal = parseInt(principalRp.replace(/\D/g, '')) || 0;
    const selectedCollateralsData = availableCollaterals.filter(c => selectedCollateralIds.includes(c.id));
    const totalCollateralValue = selectedCollateralsData.reduce((sum, c) => sum + (c.estimatedValueRp || 0), 0);
    const ltvRatio = totalCollateralValue > 0 ? (principal / totalCollateralValue) * 100 : 0;

    return (
        <AppLayout>
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Edit Gadai
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {loan.code} - {loan.customer?.fullName}
                        </p>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                Perhatian
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Ubah data dengan hati-hati. Setelah ada pembayaran atau loan di-finalize, data tidak bisa diubah lagi.
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Form Edit Gadai</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-6">
                            {/* Customer (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nasabah
                                </label>
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                    <p className="font-semibold">{loan.customer?.fullName}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{loan.customer?.phone}</p>
                                </div>
                            </div>

                            {/* Collaterals */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Barang Jaminan <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableCollaterals.map((collateral) => {
                                        const isSelected = selectedCollateralIds.includes(collateral.id);
                                        return (
                                            <div
                                                key={collateral.id}
                                                onClick={() => {
                                                    setSelectedCollateralIds(prev =>
                                                        isSelected
                                                            ? prev.filter(id => id !== collateral.id)
                                                            : [...prev, collateral.id]
                                                    );
                                                }}
                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${isSelected
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{collateral.name}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {collateral.estimatedValueRp ? formatCurrency(collateral.estimatedValueRp) : '-'}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <FiArrowLeft className="w-3 h-3 text-white rotate-180" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {availableCollaterals.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>Tidak ada barang jaminan tersedia.</p>
                                        <p className="text-sm mt-1">Semua barang jaminan mungkin sudah digunakan di gadai lain.</p>
                                    </div>
                                )}
                                {selectedCollateralIds.length > 0 && (
                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                                        {selectedCollateralIds.length} item dipilih • Total: {formatCurrency(totalCollateralValue)}
                                    </p>
                                )}
                            </div>

                            {/* Principal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Jumlah Pinjaman <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                    <Input
                                        type="text"
                                        value={principalRp ? parseInt(principalRp.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                                        onChange={(e) => setPrincipalRp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                        className="pl-12"
                                        required
                                        fullWidth
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tanggal Mulai <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        fullWidth
                                    />
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Jatuh Tempo <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={startDate}
                                        required
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* Admin Fee */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Biaya Admin (Opsional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                    <Input
                                        type="text"
                                        value={adminFeeRp ? parseInt(adminFeeRp.replace(/\D/g, '')).toLocaleString('id-ID') : '0'}
                                        onChange={(e) => setAdminFeeRp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                        className="pl-12"
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* LTV Warning */}
                            {principal > 0 && totalCollateralValue > 0 && (
                                <div className={`p-4 rounded-lg border ${ltvRatio > 80
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    : ltvRatio > 60
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    }`}>
                                    <p className={`text-sm font-medium ${ltvRatio > 80
                                        ? 'text-red-900 dark:text-red-100'
                                        : ltvRatio > 60
                                            ? 'text-yellow-900 dark:text-yellow-100'
                                            : 'text-green-900 dark:text-green-100'
                                        }`}>
                                        Loan-to-Value Ratio: {ltvRatio.toFixed(1)}%
                                    </p>
                                    {ltvRatio > 80 && (
                                        <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                                            ⚠️ LTV terlalu tinggi! Risiko kerugian besar jika nasabah default.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Interest Preview */}
                            {principal > 0 && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                        <FiPercent className="w-4 h-4" />
                                        Preview Bunga
                                    </h3>
                                    <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                                        {getAllInterestTiers(principal).map((tier, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{tier.days} hari ({tier.ratePercent}):</span>
                                                <span className="font-semibold">{formatCurrency(tier.totalDue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        leftIcon={<FiSave />}
                        disabled={submitting}
                        fullWidth
                    >
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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
            </form>
        </AppLayout>
    );
}
