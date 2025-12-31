"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { FiArrowLeft, FiSave, FiPackage, FiCamera, FiX, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/Loading';

export default function CreateCollateralPage() {
    const router = useRouter();
    const toast = useToast();

    // Photo upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedValueRp: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Combine current and new files, limit to 3
        const currentCount = selectedFiles.length;
        const newFiles: File[] = [];
        let validCount = 0;

        for (let i = 0; i < files.length; i++) {
            if (currentCount + validCount >= 3) {
                toast.warning('Maksimal 3 foto');
                break;
            }

            const file = files[i];

            // Validate type
            if (!file.type.match(/^image\/(jpeg|png)$/)) {
                toast.error(`File ${file.name} format tidak didukung`, 'Gunakan JPG atau PNG');
                continue;
            }

            // Validate size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} terlalu besar`, 'Maksimal 5MB');
                continue;
            }

            newFiles.push(file);
            validCount++;
        }

        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);

            // Generate previews
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrls(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }

        // Reset input for next selection
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

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

            // 1. Create Collateral
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                estimatedValueRp: formData.estimatedValueRp
                    ? parseInt(formData.estimatedValueRp.replace(/\D/g, ''))
                    : undefined,
            };

            const response = await api.post('/collaterals', payload);
            const collateralId = response.data?.id || response.data;

            // 2. Upload Photos (if any)
            if (selectedFiles.length > 0) {
                try {
                    const photoFormData = new FormData();
                    selectedFiles.forEach(file => {
                        photoFormData.append('photos', file);
                    });

                    await api.post(`/collaterals/${collateralId}/photos`, photoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                } catch (uploadError: any) {
                    console.error('Photo upload failed:', uploadError);
                    toast.warning('Barang dibuat, tetapi foto gagal diupload: ' + (uploadError.response?.data?.message || uploadError.message));
                }
            }

            toast.success('Barang jaminan berhasil ditambahkan');
            router.push(`/collaterals/${collateralId}`);

        } catch (error: any) {
            console.error('Error creating collateral:', error);
            toast.error('Gagal menambahkan barang jaminan', error.response?.data?.message || error.message);
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

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/collaterals">
                        <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Tambah Barang Jaminan
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Isi informasi barang jaminan baru
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
                            {/* Photo Upload Section */}
                            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Foto Barang (Opsional, Max 3)
                                    </label>
                                    <span className="text-xs text-gray-500">
                                        {selectedFiles.length} / 3 Foto
                                    </span>
                                </div>

                                {previewUrls.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="relative aspect-square group">
                                                <img
                                                    src={url}
                                                    className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                                    alt={`Preview ${index}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Add button slot if < 3 */}
                                        {previewUrls.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                            >
                                                <FiCamera size={24} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 mt-1">Tambah</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                    >
                                        <FiCamera size={32} className="text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Klik untuk upload foto
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maksimal 5MB per file (JPG/PNG)
                                        </p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/jpeg,image/png"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                            </div>

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
                                    <li>• Barang akan tersimpan dan siap digunakan untuk gadai</li>
                                    <li>• Nama barang harus jelas dan spesifik</li>
                                    <li>• Estimasi nilai membantu menentukan jumlah pinjaman</li>
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
                                    {submitting ? 'Menyimpan...' : 'Simpan Barang Jaminan'}
                                </Button>
                                <Link href="/collaterals" className="flex-1">
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
