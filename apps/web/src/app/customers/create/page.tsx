"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { validateNIK, validatePhone } from '@/lib/utils';
import { FiSave, FiX, FiCamera, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/Loading';

export default function CreateCustomerPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Photo upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toast.error('Format file tidak didukung', 'Gunakan JPG atau PNG');
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File terlalu besar', 'Maksimal 5MB');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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

            // 1. Create Customer
            const response = await api.post('/customers', formData);
            const customerId = response.data.id;

            // 2. Upload Photo (if selected)
            if (selectedFile) {
                try {
                    const photoFormData = new FormData();
                    photoFormData.append('photo', selectedFile);

                    await api.post(`/customers/${customerId}/photo`, photoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                } catch (uploadError) {
                    console.error('Photo upload failed:', uploadError);
                    toast.warning('Nasabah dibuat, tetapi foto gagal diupload');
                    // Continue to redirect, don't stop the flow
                }
            }

            toast.success('Nasabah berhasil ditambahkan');
            router.push(`/customers/${customerId}`);
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
                            {/* Photo Upload Section */}
                            <div className="flex flex-col items-center justify-center p-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Foto Profil (Opsional)
                                </span>

                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-sm bg-gray-50 flex items-center justify-center">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FiCamera className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="absolute bottom-0 right-0 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition-all"
                                            title={previewUrl ? "Ganti Foto" : "Pilih Foto"}
                                        >
                                            <FiCamera size={16} />
                                        </button>

                                        {previewUrl && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-all"
                                                title="Hapus Foto"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileSelect}
                                />
                                <p className="text-xs text-gray-500 mt-3">
                                    Maksimal 5MB (JPG/PNG)
                                </p>
                            </div>

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
                                    {loading ? 'Menyimpan...' : 'Simpan Nasabah'}
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
