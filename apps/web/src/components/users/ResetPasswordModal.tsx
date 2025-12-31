"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { User } from '@/lib/types/user';

interface ResetPasswordModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ResetPasswordModal({ user, isOpen, onClose }: ResetPasswordModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        if (password !== confirmPassword) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        try {
            setLoading(true);
            await api.put(`/users/${user.id}/reset-password`, { newPassword: password });
            toast.success('Password berhasil direset');
            onClose();
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            toast.error(error.response?.data?.message || 'Gagal reset password');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reset Password User: ${user.username}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                    Warning: Password lama tidak akan bisa digunakan lagi. User harus login dengan password baru.
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password Baru
                    </label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Konfirmasi Password Baru
                    </label>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Ulangi password baru"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" variant="danger" disabled={loading}>
                        {loading ? 'Processing...' : 'Reset Password'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
