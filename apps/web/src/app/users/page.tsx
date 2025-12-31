"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { User } from '@/lib/types/user';
import { FiPlus, FiSearch, FiEdit2, FiLock, FiUser, FiPhone, FiMapPin, FiCheckCircle, FiXCircle, FiTrash2 } from 'react-icons/fi';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);

    // Confirmation States
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        type: 'DEACTIVATE' | 'RESTORE' | 'DELETE_PERMANENT';
        user: User | null;
        loading: boolean;
    }>({
        isOpen: false,
        type: 'DEACTIVATE',
        user: null,
        loading: false
    });

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // Auto refresh every 1 minute
        return () => clearInterval(interval);
    }, []);

    const isUserOnline = (dateString?: string) => {
        if (!dateString) return false;
        const diff = Date.now() - new Date(dateString).getTime();
        return diff < 5 * 60 * 1000; // 5 minutes threshold
    };

    async function loadData() {
        try {
            // Only show loader on initial load
            if (users.length === 0) setLoading(true);

            const [usersRes, branchesRes] = await Promise.all([
                api.get<User[]>('/users'),
                api.get('/system/branches'),
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error: any) {
            console.error('Error loading users:', error);
            if (error.response?.status === 403) {
                toast.error('Anda tidak memiliki akses ke halaman ini');
            } else {
                // Silent fail on background refresh or show toast only on initial
                if (loading) toast.error('Gagal memuat data user');
            }
        } finally {
            setLoading(false);
        }
    }

    // Open Modals
    const handleDelete = (user: User) => {
        setConfirmState({ isOpen: true, type: 'DEACTIVATE', user, loading: false });
    };

    const handleRestore = (user: User) => {
        setConfirmState({ isOpen: true, type: 'RESTORE', user, loading: false });
    };

    const handlePermanentDelete = (user: User) => {
        setConfirmState({ isOpen: true, type: 'DELETE_PERMANENT', user, loading: false });
    };

    // Execute Actions
    async function processConfirmation() {
        const { type, user } = confirmState;
        if (!user) return;

        setConfirmState(prev => ({ ...prev, loading: true }));

        try {
            if (type === 'DEACTIVATE') {
                await api.put(`/users/${user.id}`, { isActive: false });
                toast.success(`User ${user.fullName} berhasil dinonaktifkan`);
            } else if (type === 'RESTORE') {
                await api.put(`/users/${user.id}`, { isActive: true });
                toast.success(`User ${user.fullName} berhasil diaktifkan kembali`);
            } else if (type === 'DELETE_PERMANENT') {
                await api.delete(`/users/${user.id}`);
                toast.success(`User ${user.fullName} berhasil dihapus permanen`);
            }

            loadData();
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            console.error('Action failed:', error);
            toast.error(error.response?.data?.message || 'Gagal memproses tindakan');
        } finally {
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    }

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data user..." />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FiUser className="w-6 h-6" />
                            Manajemen User
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Kelola data pengguna sistem, role, dan akses cabang.
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<FiPlus />} className="w-full sm:w-auto">
                        Tambah User
                    </Button>
                </div>

                {/* Search */}
                <div className="relative w-full max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* User Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((user) => {
                        const online = isUserOnline(user.lastActiveAt);
                        return (
                            <div
                                key={user.id}
                                className={`bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border p-6 transition-all hover:shadow-md relative overflow-hidden ${user.isActive ? 'border-gray-200 dark:border-gray-800' : 'border-red-200 dark:border-red-900/30'
                                    }`}
                            >
                                {/* Online Indicator Strip */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${online ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`} />

                                <div className="flex justify-between items-start mb-4 pl-2 mt-2">
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${user.role.name === 'MANAJER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                    user.role.name === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {user.role.name}
                                                </span>
                                                {!user.isActive && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                        NONAKTIF
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 h-4">
                                            {online ? (
                                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    ONLINE
                                                </span>
                                            ) : (
                                                user.lastActiveAt && (
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                        {new Date(user.lastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 pl-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <FiMapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{user.branch.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiPhone className="w-4 h-4 flex-shrink-0" />
                                            <span>{user.phone || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 pl-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setEditingUser(user)}
                                        className="w-full text-xs"
                                    >
                                        <FiEdit2 className="mr-1" /> Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        onClick={() => setResettingUser(user)}
                                    >
                                        <FiLock className="mr-1" /> Reset Pwd
                                    </Button>

                                    {/* Delete / Restore Button */}
                                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                        {user.isActive ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(user)}
                                            >
                                                <FiTrash2 className="mr-1" /> Nonaktifkan User
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="w-full text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    onClick={() => handleRestore(user)}
                                                >
                                                    <FiCheckCircle className="mr-1" /> Aktifkan User
                                                </Button>

                                                {/* Hard Delete Option for Inactive Users */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="w-full text-xs text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                                                    onClick={() => handlePermanentDelete(user)}
                                                >
                                                    <FiXCircle className="mr-1" /> Hapus Permanen
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredUsers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Tidak ada user ditemukan.
                        </div>
                    )}
                </div>

                {/* Modals */}
                <CreateUserModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={loadData}
                    branches={branches}
                />

                <EditUserModal
                    user={editingUser}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={loadData}
                />

                <ResetPasswordModal
                    user={resettingUser}
                    isOpen={!!resettingUser}
                    onClose={() => setResettingUser(null)}
                />

                {/* Unified Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmState.isOpen}
                    onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={processConfirmation}
                    title={
                        confirmState.type === 'DEACTIVATE' ? 'Nonaktifkan User' :
                            confirmState.type === 'RESTORE' ? 'Aktifkan User' :
                                'Hapus User Permanen'
                    }
                    message={
                        confirmState.type === 'DEACTIVATE' ? `Apakah Anda yakin ingin menonaktifkan user "${confirmState.user?.fullName}"? User tidak akan bisa login.` :
                            confirmState.type === 'RESTORE' ? `Aktifkan kembali user "${confirmState.user?.fullName}" agar bisa login?` :
                                `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN user "${confirmState.user?.fullName}" dari database? Tindakan ini tidak bisa dibatalkan!`
                    }
                    variant={confirmState.type === 'DELETE_PERMANENT' ? 'danger' : 'primary'}
                    confirmText={
                        confirmState.type === 'DEACTIVATE' ? 'Ya, Nonaktifkan' :
                            confirmState.type === 'RESTORE' ? 'Ya, Aktifkan' :
                                'Hapus Permanen'
                    }
                    loading={confirmState.loading}
                />
            </div>
        </AppLayout>
    );
}
