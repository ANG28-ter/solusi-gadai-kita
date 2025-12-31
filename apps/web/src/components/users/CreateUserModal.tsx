"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { CreateUserPayload, UserRole } from '@/lib/types/user';

interface Branch {
    id: string;
    name: string;
}

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    branches: Branch[];
}

export function CreateUserModal({ isOpen, onClose, onSuccess, branches }: CreateUserModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateUserPayload>({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'KASIR', // default
        branchId: branches[0]?.id || '',
    });

    // Update branchId if branches load late
    React.useEffect(() => {
        if (!formData.branchId && branches.length > 0) {
            setFormData(prev => ({ ...prev, branchId: branches[0].id }));
        }
    }, [branches]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.branchId) {
            toast.error('Pilih cabang terlebih dahulu');
            return;
        }

        try {
            setLoading(true);
            await api.post('/users', formData);
            toast.success('User berhasil dibuat');
            onSuccess();
            onClose();
            setFormData({
                username: '',
                password: '',
                fullName: '',
                phone: '',
                role: 'KASIR',
                branchId: branches[0]?.id || '',
            });
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.response?.data?.message || 'Gagal membuat user');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah User Baru">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                    </label>
                    <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Contoh: kasir_unit1"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                    </label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nama Lengkap
                    </label>
                    <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nama Pegawai"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        No. Telepon (Opsional)
                    </label>
                    <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0812..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="KASIR">KASIR</option>
                            <option value="MANAJER">MANAJER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cabang
                        </label>
                        <select
                            value={formData.branchId}
                            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan User'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
