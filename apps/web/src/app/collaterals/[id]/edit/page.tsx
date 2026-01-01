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
import { CollateralItem } from '@/lib/types';
import { FiArrowLeft, FiSave, FiPackage } from 'react-icons/fi';
import Link from 'next/link';

export default function EditCollateralPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [collateral, setCollateral] = useState<CollateralItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedValueRp: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCollateralData();
    }, [params.id]);

    async function loadCollateralData() {
        try {
            setLoading(true);
            const response = await api.get(`/collaterals/${params.id}`);
            const data = response.data;

            if (!data) {
                throw new Error('Collateral not found');
            }

            // Check if collateral is attached to a loan
            if (data.loanId) {
                toast.error('Barang jaminan sedang digadaikan', 'Tidak dapat diedit');
                router.push(`/collaterals/${params.id}`);
                return;
            }

            setCollateral(data);
            setFormData({
                name: data.name || '',
                description: data.description || '',
                estimatedValueRp: data.estimatedValueRp ? data.estimatedValueRp.toString() : '',
            });
        } catch (error: any) {
            console.error('Error loading collateral:', error);
            toast.error('Gagal memuat data barang jaminan', error.response?.data?.message || error.message);
            router.push('/collaterals');
        } finally {
            setLoading(false);
        }
    }

    function validateForm() {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama barang wajib diisi';
        }

        const value = parseInt(formData.estimatedValueRp.replace(/\D/g, ''));
        if (formData.estimatedValueRp && (!value || value <= 0)) {
            newErrors.estimatedValueRp = 'Estimasi nilai harus lebih dari 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                estimatedValueRp: formData.estimatedValueRp
                    ? parseInt(formData.estimatedValueRp.replace(/\D/g, ''))
                    : undefined,
            };

            await api.patch(`/collaterals/${params.id}`, payload);

            toast.success('Barang jaminan berhasil diperbarui');
            router.push(`/collaterals/${params.id}`);

        } catch (error: any) {
            console.error('Error updating collateral:', error);
            toast.error('Gagal memperbarui barang jaminan', error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleInputChange(field: string, value: string) {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data barang jaminan..." />
            </AppLayout>
        );
    }

    if (!collateral) {
        return null;
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/collaterals/${params.id}`}>
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Edit Barang Jaminan
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Perbarui informasi barang jaminan
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FiPackage className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Informasi Barang</h2>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Barang <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Contoh: Laptop Asus ROG, Gelang Emas 24K"
                                    required
                                    fullWidth
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    placeholder="Detail barang: kondisi, spesifikasi, ciri khas, dll"
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
                                />
                            </div>

                            {/* Estimated Value */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Estimasi Nilai
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        Rp
                                    </span>
                                    <Input
                                        type="text"
                                        value={formData.estimatedValueRp ? parseInt(formData.estimatedValueRp.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                                        onChange={(e) => handleInputChange('estimatedValueRp', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                        className="pl-12"
                                        fullWidth
                                    />
                                </div>
                                {errors.estimatedValueRp && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.estimatedValueRp}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Taksiran nilai barang untuk referensi
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    ℹ️ Informasi
                                </h4>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <li>• Foto barang dapat dikelola di halaman detail</li>
                                    <li>• Perubahan akan langsung tersimpan</li>
                                    <li>• Barang yang sedang digadaikan tidak dapat diedit</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    leftIcon={<FiSave />}
                                    fullWidth
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                                <Link href={`/collaterals/${params.id}`} className="flex-1">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={submitting}
                                        fullWidth
                                    >
                                        Batal
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
