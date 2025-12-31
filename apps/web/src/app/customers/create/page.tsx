"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { validateNIK, validatePhone } from '@/lib/utils';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

export default function CreateCustomerPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        nik: '',
        phone: '',
        address: '',
    });

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
            newErrors.name = 'Nama wajib diisi';
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
            setLoading(true);
            const response = await api.post('/customers', formData);
            toast.success('Nasabah berhasil ditambahkan');
            router.push(`/customers/${response.data.id}`);
        } catch (error: any) {
            toast.error('Gagal menambahkan nasabah', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Tambah Nasabah Baru
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Lengkapi data nasabah di bawah ini
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Nama Lengkap"
                                placeholder="Masukkan nama lengkap"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
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
                                    loading={loading}
                                    disabled={loading}
                                >
                                    Simpan Nasabah
                                </Button>
                                <Link href="/customers">
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
