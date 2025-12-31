"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Customer, CollateralItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { getAllInterestTiers } from '@/lib/loan-utils';
import {
    FiArrowLeft, FiArrowRight, FiCheck, FiUser,
    FiPackage, FiDollarSign, FiFileText, FiPercent, FiAlertTriangle
} from 'react-icons/fi';
import Link from 'next/link';

type WizardStep = 1 | 2 | 3 | 4;

export default function CreateLoanPage() {
    const router = useRouter();
    const toast = useToast();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>(1);
    const [submitting, setSubmitting] = useState(false);

    // Data state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [collaterals, setCollaterals] = useState<CollateralItem[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Form state
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedCollateralIds, setSelectedCollateralIds] = useState<string[]>([]);
    const [principalRp, setPrincipalRp] = useState('');
    const [tenorMonths, setTenorMonths] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [adminFeeRp, setAdminFeeRp] = useState('0');

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        try {
            setLoadingData(true);

            // Load customers
            const customersRes = await api.get('/customers');
            setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data?.data || []);

            // Load available collaterals (loanId = null)
            const collateralsRes = await api.get('/collaterals/draft');
            const allCollaterals = Array.isArray(collateralsRes.data) ? collateralsRes.data : collateralsRes.data?.data || [];
            // Filter only available (no loanId)
            setCollaterals(allCollaterals.filter((c: CollateralItem) => !c.loanId));

        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data', error.response?.data?.message || error.message);
        } finally {
            setLoadingData(false);
        }
    }

    // Auto calculate due date from tenor
    useEffect(() => {
        if (tenorMonths && startDate) {
            const months = parseInt(tenorMonths);
            if (months > 0) {
                const start = new Date(startDate);
                const due = new Date(start);
                due.setMonth(due.getMonth() + months);
                setDueDate(due.toISOString().split('T')[0]);
            }
        }
    }, [tenorMonths, startDate]);

    function handleNext() {
        // Validation before moving to next step
        if (currentStep === 1 && !selectedCustomerId) {
            toast.error('Pilih nasabah terlebih dahulu');
            return;
        }
        if (currentStep === 2 && selectedCollateralIds.length === 0) {
            toast.error('Pilih minimal 1 barang jaminan');
            return;
        }
        if (currentStep === 3) {
            const principal = parseInt(principalRp.replace(/\D/g, ''));
            if (!principal || principal <= 0) {
                toast.error('Jumlah pinjaman harus lebih dari 0');
                return;
            }
            if (!startDate || !dueDate) {
                toast.error('Tanggal mulai dan jatuh tempo harus diisi');
                return;
            }
        }

        setCurrentStep((prev) => Math.min(prev + 1, 4) as WizardStep);
    }

    function handleBack() {
        setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStep);
    }

    async function handleSubmit() {
        try {
            setSubmitting(true);

            const principal = parseInt(principalRp.replace(/\D/g, ''));

            const payload = {
                customerId: selectedCustomerId,
                principalRp: principal,
                collateralIds: selectedCollateralIds,
                adminFeeRp: parseInt(adminFeeRp.replace(/\D/g, '')) || 0,
            };

            const response = await api.post('/loans', payload);
            const loanId = response.data?.id || response.data;

            toast.success('Gadai berhasil dibuat!');
            router.push(`/loans/${loanId}`);

        } catch (error: any) {
            console.error('Error creating loan:', error);
            toast.error('Gagal membuat gadai', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    // Get selected entities
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const selectedCollateralsData = collaterals.filter(c => selectedCollateralIds.includes(c.id));
    const totalCollateralValue = selectedCollateralsData.reduce((sum, c) => sum + (c.estimatedValueRp || 0), 0);
    const principal = parseInt(principalRp.replace(/\D/g, '')) || 0;
    const ltvRatio = totalCollateralValue > 0 ? (principal / totalCollateralValue) * 100 : 0;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/loans">
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Buat Gadai Baru
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Ikuti langkah-langkah untuk membuat gadai baru
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between">
                    {[
                        { num: 1, label: 'Nasabah', icon: FiUser },
                        { num: 2, label: 'Jaminan', icon: FiPackage },
                        { num: 3, label: 'Detail', icon: FiDollarSign },
                        { num: 4, label: 'Review', icon: FiFileText },
                    ].map((step, idx) => (
                        <React.Fragment key={step.num}>
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.num
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                        }`}
                                >
                                    {currentStep > step.num ? (
                                        <FiCheck className="w-6 h-6" />
                                    ) : (
                                        <step.icon className="w-6 h-6" />
                                    )}
                                </div>
                                <p className={`text-xs mt-2 hidden sm:block ${currentStep >= step.num ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500'
                                    }`}>
                                    {step.label}
                                </p>
                            </div>
                            {idx < 3 && (
                                <div className={`flex-1 h-1 ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Content */}
                <Card>
                    <CardBody>
                        {/* Step 1: Customer Selection */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FiUser /> Pilih Nasabah
                                </h2>

                                {loadingData ? (
                                    <p className="text-center py-8 text-gray-500">Memuat data nasabah...</p>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {customers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                onClick={() => setSelectedCustomerId(customer.id)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedCustomerId === customer.id
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {customer.fullName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {customer.phone} • {customer.address}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                            NIK: {customer.nik || '-'}
                                                        </p>
                                                    </div>
                                                    {selectedCustomerId === customer.id && (
                                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <FiCheck className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Collateral Selection */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <FiPackage /> Pilih Barang Jaminan
                                    </h2>
                                    <span className="text-sm text-gray-500">
                                        {selectedCollateralIds.length} dipilih
                                    </span>
                                </div>

                                {collaterals.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">Tidak ada barang jaminan tersedia</p>
                                        <Link href="/collaterals/create">
                                            <Button size="sm">Tambah Barang Jaminan</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {collaterals.map((collateral) => {
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
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {collateral.name}
                                                            </h3>
                                                            {collateral.description && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    {collateral.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {collateral.estimatedValueRp ? formatCurrency(collateral.estimatedValueRp) : '-'}
                                                            </p>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-2 ml-auto">
                                                                    <FiCheck className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {selectedCollateralIds.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Total Estimasi Nilai: {formatCurrency(totalCollateralValue)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Loan Details */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FiDollarSign /> Detail Gadai
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tenor (Bulan)
                                        </label>
                                        <Input
                                            type="number"
                                            value={tenorMonths}
                                            onChange={(e) => setTenorMonths(e.target.value)}
                                            min="1"
                                            fullWidth
                                        />
                                    </div>

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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tanggal Jatuh Tempo <span className="text-red-500">*</span>
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

                                    {/* Net Disbursed (Uang Yang Diterima) */}
                                    {principal > 0 && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                                    💰 Uang Yang Diterima Nasabah:
                                                </p>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700 dark:text-gray-300">Pokok Pinjaman:</span>
                                                        <span className="font-semibold">{formatCurrency(principal)}</span>
                                                    </div>
                                                    {parseInt(adminFeeRp) > 0 && (
                                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                                            <span>Biaya Admin:</span>
                                                            <span className="font-semibold">- {formatCurrency(parseInt(adminFeeRp))}</span>
                                                        </div>
                                                    )}
                                                    <div className="pt-2 border-t-2 border-green-300 dark:border-green-700">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-green-900 dark:text-green-100">Total Diterima:</span>
                                                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                                {formatCurrency(principal - parseInt(adminFeeRp))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                                                    ℹ️ Ini adalah jumlah uang yang akan diterima nasabah setelah dipotong biaya admin.
                                                </p>
                                            </div>
                                        </div>
                                    )}
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

                                {/* Interest Rate Preview */}
                                {principal > 0 && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-5">
                                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                                            <FiPercent className="w-5 h-5" />
                                            Estimasi Bunga & Total Pembayaran
                                        </h3>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                                            Sistem bunga bertingkat berdasarkan durasi gadai:
                                        </p>

                                        {(() => {
                                            const tiers = getAllInterestTiers(principal);
                                            return (
                                                <div className="space-y-3">
                                                    {tiers.map((tier, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-4 rounded-lg ${tier.isOverdue
                                                                ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                                                                : idx === 0
                                                                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <span className={`text-xs font-medium ${tier.isOverdue
                                                                        ? 'text-red-800 dark:text-red-200'
                                                                        : idx === 0
                                                                            ? 'text-green-800 dark:text-green-200'
                                                                            : 'text-yellow-800 dark:text-yellow-200'
                                                                        }`}>
                                                                        {tier.description}
                                                                    </span>
                                                                    <p className={`text-lg font-bold mt-1 ${tier.isOverdue
                                                                        ? 'text-red-900 dark:text-red-100'
                                                                        : idx === 0
                                                                            ? 'text-green-900 dark:text-green-100'
                                                                            : 'text-yellow-900 dark:text-yellow-100'
                                                                        }`}>
                                                                        {tier.ratePercent} Bunga
                                                                    </p>
                                                                </div>
                                                                {idx === 0 && (
                                                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                                                        Hemat!
                                                                    </span>
                                                                )}
                                                                {tier.isOverdue && (
                                                                    <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <p className={`text-xs ${tier.isOverdue
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : idx === 0
                                                                            ? 'text-green-600 dark:text-green-400'
                                                                            : 'text-yellow-600 dark:text-yellow-400'
                                                                        }`}>
                                                                        Pokok:
                                                                    </p>
                                                                    <p className="font-semibold">{formatCurrency(principal)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className={`text-xs ${tier.isOverdue
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : idx === 0
                                                                            ? 'text-green-600 dark:text-green-400'
                                                                            : 'text-yellow-600 dark:text-yellow-400'
                                                                        }`}>
                                                                        Bunga:
                                                                    </p>
                                                                    <p className="font-semibold">{formatCurrency(tier.interestAmount)}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`mt-3 pt-3 border-t ${tier.isOverdue
                                                                ? 'border-red-300 dark:border-red-700'
                                                                : idx === 0
                                                                    ? 'border-green-300 dark:border-green-700'
                                                                    : 'border-yellow-300 dark:border-yellow-700'
                                                                }`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium">Total:</span>
                                                                    <span className={`text-lg font-bold ${tier.isOverdue
                                                                        ? 'text-red-900 dark:text-red-100'
                                                                        : idx === 0
                                                                            ? 'text-green-900 dark:text-green-100'
                                                                            : 'text-yellow-900 dark:text-yellow-100'
                                                                        }`}>
                                                                        {formatCurrency(tier.totalDue)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                            <p className="text-xs text-indigo-900 dark:text-indigo-100">
                                                <strong>💡 Tips:</strong> Bayar dalam 15 hari pertama untuk hemat bunga 50%!
                                                Setelah 30 hari dianggap overdue dan bunga tetap 10%.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FiFileText /> Review & Konfirmasi
                                </h2>

                                <div className="space-y-4">
                                    {/* Customer */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Nasabah</h3>
                                        <p className="text-sm">{selectedCustomer?.fullName}</p>
                                        <p className="text-xs text-gray-500">{selectedCustomer?.phone}</p>
                                    </div>

                                    {/* Collaterals */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Barang Jaminan ({selectedCollateralsData.length})
                                        </h3>
                                        <ul className="text-sm space-y-1">
                                            {selectedCollateralsData.map((c, idx) => (
                                                <li key={c.id} className="flex justify-between">
                                                    <span>{idx + 1}. {c.name}</span>
                                                    <span className="font-medium">
                                                        {c.estimatedValueRp ? formatCurrency(c.estimatedValueRp) : '-'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between font-semibold">
                                                <span>Total:</span>
                                                <span>{formatCurrency(totalCollateralValue)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loan Details */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Detail Gadai</h3>
                                        <dl className="text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Jumlah Pinjaman:</dt>
                                                <dd className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(principal)}</dd>
                                            </div>
                                            {tenorMonths && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-600 dark:text-gray-400">Tenor:</dt>
                                                    <dd>{tenorMonths} bulan</dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Tanggal Mulai:</dt>
                                                <dd>{new Date(startDate).toLocaleDateString('id-ID')}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-600 dark:text-gray-400">Jatuh Tempo:</dt>
                                                <dd>{new Date(dueDate).toLocaleDateString('id-ID')}</dd>
                                            </div>
                                            {parseInt(adminFeeRp) > 0 && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-600 dark:text-gray-400">Biaya Admin:</dt>
                                                    <dd>{formatCurrency(parseInt(adminFeeRp))}</dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <dt className="text-gray-600 dark:text-gray-400">LTV Ratio:</dt>
                                                <dd className={ltvRatio > 80 ? 'text-red-600 font-semibold' : ''}>
                                                    {ltvRatio.toFixed(1)}%
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="secondary"
                        onClick={handleBack}
                        disabled={currentStep === 1 || submitting}
                        leftIcon={<FiArrowLeft />}
                    >
                        Kembali
                    </Button>

                    {currentStep < 4 ? (
                        <Button
                            onClick={handleNext}
                            rightIcon={<FiArrowRight />}
                            disabled={submitting}
                        >
                            Lanjut
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            leftIcon={<FiCheck />}
                        >
                            {submitting ? 'Menyimpan...' : 'Buat Gadai'}
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
