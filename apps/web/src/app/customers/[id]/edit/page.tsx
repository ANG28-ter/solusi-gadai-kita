"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { Customer } from '@/lib/types';
import { validateNIK, validatePhone } from '@/lib/utils';
import { FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        nik: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        loadCustomer();
    }, [params.id]);

    async function loadCustomer() {
        try {
            setLoading(true);
            const response = await api.get(`/customers/${params.id}`);
            const customer: Customer = response.data;

            setFormData({
                name: customer.fullName,
                nik: customer.nik || '',
                phone: customer.phone || '',
                address: customer.address || '',
            });
        } catch (error: any) {
            toast.error('Gagal memuat data nasabah', error.message);
            router.push('/customers');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(field: string, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }

    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap wajib diisi';
        }

        if (formData.nik && !validateNIK(formData.nik)) {
            newErrors.nik = 'NIK harus 16 digit angka';
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) {
            toast.warning('Mohon perbaiki kesalahan pada form');
            return;
        }

        try {
            setSaving(true);
            await api.patch(`/customers/${params.id}`, formData);
            toast.success('Data nasabah berhasil diupdate');
            router.push(`/customers/${params.id}`);
        } catch (error: any) {
            toast.error('Gagal mengupdate data nasabah', error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data nasabah..." />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/customers/${params.id}`}>
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Edit Nasabah
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Update data nasabah
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Nama Lengkap"
                                placeholder="Masukkan nama lengkap"
                                value={formData.name}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                error={errors.name}
                                required
                                fullWidth
                            />

                            <Input
                                label="NIK"
                                placeholder="16 digit NIK"
                                value={formData.nik}
                                onChange={(e) => handleChange('nik', e.target.value)}
                                error={errors.nik}
                                helperText="Nomor Induk Kependudukan (16 digit)"
                                maxLength={16}
                                fullWidth
                            />

                            <Input
                                label="No. Telepon"
                                placeholder="08xxxxxxxxxx"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                error={errors.phone}
                                helperText="Format: 08xxxxxxxxxx atau 628xxxxxxxxxx"
                                fullWidth
                            />

                            <Textarea
                                label="Alamat"
                                placeholder="Masukkan alamat lengkap"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                error={errors.address}
                                rows={4}
                                fullWidth
                            />

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    type="submit"
                                    leftIcon={<FiSave />}
                                    loading={saving}
                                    disabled={saving}
                                >
                                    Simpan Perubahan
                                </Button>
                                <Link href={`/customers/${params.id}`}>
                                    <Button type="button" variant="ghost" leftIcon={<FiX />}>
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
