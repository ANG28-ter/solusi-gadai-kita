"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { UpdateUserPayload, User } from '@/lib/types/user';

import { useAuth } from '@/lib/auth-context';
import { RoleName } from '@/lib/types';
import { Select } from '@/components/ui/Select';

interface EditUserModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onSuccess }: EditUserModalProps) {
    const toast = useToast();
    const { user: currentUser, updateUserContext } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateUserPayload & { role: string }>({
        fullName: '',
        phone: '',
        isActive: true,
        role: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName,
                phone: user.phone || '',
                isActive: user.isActive,
                role: user.role?.name || '',
            });
        }
    }, [user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            const response = await api.put(`/users/${user.id}`, formData);
            const updatedUser = response.data;

            toast.success('User berhasil diupdate');

            // If we edited the current user, update the global auth context
            if (currentUser && currentUser.id === user.id) {
                updateUserContext({
                    fullName: updatedUser.fullName,
                    phone: updatedUser.phone || undefined,
                    role: (updatedUser.role?.name || currentUser.role) as RoleName,
                    // If backend returns branch, update it too if moved
                    ...(updatedUser.branch?.name ? { branchName: updatedUser.branch.name } : {})
                });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating user:', error);
            toast.error(error.response?.data?.message || 'Gagal update user');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.username}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nama Lengkap
                    </label>
                    <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <Select
                        label="Jabatan (Role)"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { value: 'KASIR', label: 'KASIR' },
                            { value: 'MANAJER', label: 'MANAJER' },
                            { value: 'ADMIN', label: 'ADMIN' },
                        ]}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        No. Telepon
                    </label>
                    <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                        Status Aktif (Bisa Login)
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
