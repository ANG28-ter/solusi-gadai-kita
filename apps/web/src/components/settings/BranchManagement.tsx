import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiHash, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { api } from '@/lib/api';
import { BranchModal } from './BranchModal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface Branch {
    id: string;
    code: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
}

export function BranchManagement() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const toast = useToast();

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        type: 'DEACTIVATE' | 'RESTORE' | 'DELETE_PERMANENT';
        branch: Branch | null;
        loading: boolean;
    }>({
        isOpen: false,
        type: 'DEACTIVATE',
        branch: null,
        loading: false
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await api.get('/system/branches');
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedBranch(null);
        setIsModalOpen(true);
    };

    const handleEdit = (branch: Branch) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    const handleDelete = (branch: Branch) => {
        setConfirmState({ isOpen: true, type: 'DEACTIVATE', branch, loading: false });
    };

    const handleRestore = (branch: Branch) => {
        setConfirmState({ isOpen: true, type: 'RESTORE', branch, loading: false });
    };

    const handlePermanentDelete = (branch: Branch) => {
        setConfirmState({ isOpen: true, type: 'DELETE_PERMANENT', branch, loading: false });
    };

    const processConfirmation = async () => {
        const { type, branch } = confirmState;
        if (!branch) return;

        setConfirmState(prev => ({ ...prev, loading: true }));

        try {
            if (type === 'DEACTIVATE') {
                await api.put(`/system/branches/${branch.id}`, { isActive: false });
                toast.success('Cabang berhasil dinonaktifkan.');
            } else if (type === 'RESTORE') {
                await api.put(`/system/branches/${branch.id}`, { isActive: true });
                toast.success('Cabang berhasil diaktifkan kembali.');
            } else if (type === 'DELETE_PERMANENT') {
                await api.delete(`/system/branches/${branch.id}`);
                toast.success('Cabang berhasil dihapus permanen.');
            }

            fetchBranches();
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memproses tindakan.');
        } finally {
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    };

    if (loading) return <PageLoader message="Memuat cabang..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 self-start sm:self-auto">Daftar Cabang</h2>
                <Button onClick={handleCreate} leftIcon={<FiPlus />} className="w-full sm:w-auto">
                    Tambah Cabang
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                    <div
                        key={branch.id}
                        className={`bg-white dark:bg-[#1A1F2E] p-5 rounded-2xl border ${branch.isActive ? 'border-gray-200 dark:border-gray-800' : 'border-red-200 dark:border-red-900 opacity-60'}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    {branch.name}
                                    {branch.code && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-mono">
                                            {branch.code}
                                        </span>
                                    )}
                                </h3>
                                {!branch.isActive && <span className="text-xs text-red-500 font-bold mt-1 block">NONAKTIF</span>}
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => handleEdit(branch)}
                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="Edit Cabang"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                </button>

                                {branch.isActive ? (
                                    <button
                                        onClick={() => handleDelete(branch)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Nonaktifkan Cabang"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleRestore(branch)}
                                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Aktifkan Cabang"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handlePermanentDelete(branch)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Hapus Permanen"
                                        >
                                            <FiXCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-start gap-2">
                                <FiMapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{branch.address || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiPhone className="w-4 h-4" />
                                <span>{branch.phone || '-'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchBranches}
                branch={selectedBranch}
            />

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={processConfirmation}
                title={
                    confirmState.type === 'DEACTIVATE' ? 'Nonaktifkan Cabang' :
                        confirmState.type === 'RESTORE' ? 'Aktifkan Cabang' :
                            'Hapus Cabang Permanen'
                }
                message={
                    confirmState.type === 'DEACTIVATE' ? `Apakah Anda yakin ingin menonaktifkan cabang "${confirmState.branch?.name}"?` :
                        confirmState.type === 'RESTORE' ? `Aktifkan kembali cabang "${confirmState.branch?.name}"?` :
                            `PERINGATAN: Menghapus cabang "${confirmState.branch?.name}" secara PERMANEN? Data tidak bisa dikembalikan!`
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
    );
}
