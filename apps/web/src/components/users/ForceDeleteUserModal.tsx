'use client';

import { useState } from 'react';
import { User } from '@/lib/types/user';

interface ForceDeleteUserModalProps {
    user: User | null;
    users: User[];
    onClose: () => void;
    onConfirm: (userId: string, replacementUserId: string) => Promise<void>;
}

export default function ForceDeleteUserModal({
    user,
    users,
    onClose,
    onConfirm,
}: ForceDeleteUserModalProps) {
    const [replacementUserId, setReplacementUserId] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    // Filter out the user being deleted from the replacement options
    const availableUsers = users.filter((u) => u.id !== user.id && u.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!replacementUserId) {
            alert('Pilih user pengganti terlebih dahulu');
            return;
        }

        if (!confirm(
            `PERINGATAN: Anda akan menghapus user "${user.fullName}" secara permanen!\n\n` +
            `Semua data transaksi (gadai, pembayaran, laporan, dll) yang dibuat oleh user ini akan dialihkan ke user pengganti.\n\n` +
            `Tindakan ini TIDAK DAPAT DIBATALKAN!\n\nLanjutkan?`
        )) {
            return;
        }

        setLoading(true);
        try {
            await onConfirm(user.id, replacementUserId);
            onClose();
        } catch (error) {
            console.error('Error force deleting user:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-red-600">
                    ⚠️ Hapus User Secara Paksa
                </h2>

                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800 mb-2">
                        <strong>PERINGATAN:</strong> User ini memiliki riwayat transaksi aktif dan tidak dapat dihapus secara normal.
                    </p>
                    <p className="text-sm text-red-800">
                        Dengan force delete, semua data transaksi user akan dialihkan ke user pengganti yang Anda pilih.
                    </p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">User yang akan dihapus:</p>
                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih User Pengganti <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={replacementUserId}
                            onChange={(e) => setReplacementUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading}
                        >
                            <option value="">-- Pilih User Pengganti --</option>
                            {availableUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.fullName} (@{u.username}) - {u.role?.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Semua data transaksi akan dialihkan ke user ini
                        </p>
                    </div>

                    {availableUsers.length === 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                                Tidak ada user aktif lain yang tersedia sebagai pengganti.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !replacementUserId || availableUsers.length === 0}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Menghapus...' : 'Hapus Paksa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
