"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { LoanStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { Loan, LoanStatus } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiPlus, FiSearch, FiEye, FiDollarSign, FiTrash2 } from 'react-icons/fi';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);

    // Delete Modal State
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string; code: string }>({
        isOpen: false,
        id: '',
        code: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const toast = useToast();
    const router = useRouter();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadLoans();
    }, [currentPage, debouncedQuery, statusFilter]);

    async function loadLoans() {
        try {
            setLoading(true);
            const response = await api.get('/loans');

            // Handle response
            let data: Loan[] = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);

            // Deduplicate by loan ID
            const uniqueLoans = data.reduce((acc, loan) => {
                if (!acc.find(l => l.id === loan.id)) {
                    acc.push(loan);
                }
                return acc;
            }, [] as Loan[]);
            data = uniqueLoans;

            // Client-side filtering
            if (debouncedQuery) {
                const query = debouncedQuery.toLowerCase();
                data = data.filter(
                    (l) =>
                        l.code.toLowerCase().includes(query) ||
                        l.customer?.fullName.toLowerCase().includes(query)
                );
            }

            // Status filter
            if (statusFilter !== 'ALL') {
                data = data.filter((l) => l.status === statusFilter);
            }

            // Client-side pagination
            const totalItems = data.length;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            setLoans(paginatedData);
            setTotalPages(Math.ceil(totalItems / itemsPerPage));
        } catch (error: any) {
            console.error('Error loading loans:', error);
            toast.error('Gagal memuat data gadai', error.response?.data?.message || error.message);
            setLoans([]);
        } finally {
            setLoading(false);
        }
    }


    async function confirmDelete() {
        const { id } = deleteModalState;
        if (!id) return;

        setIsDeleting(true);
        try {
            await api.delete(`/loans/${id}`);
            toast.success('Gadai berhasil dihapus');
            setDeleteModalState({ isOpen: false, id: '', code: '' });
            loadLoans();
        } catch (error: any) {
            console.error('Error deleting loan:', error);
            toast.error('Gagal menghapus gadai', error.response?.data?.message || error.message);
        } finally {
            setIsDeleting(false);
        }
    }

    function openDeleteModal(id: string, code: string) {
        setDeleteModalState({ isOpen: true, id, code });
    }

    if (loading && loans.length === 0) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data gadai..." />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Gadai
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Kelola data pinjaman gadai
                        </p>
                    </div>
                    <Link href="/loans/create">
                        <Button leftIcon={<FiPlus />}>
                            Buat Gadai Baru
                        </Button>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Cari kode gadai atau nama nasabah..."
                            leftIcon={<FiSearch />}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            fullWidth
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="block w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 appearance-none"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="OVERDUE">Jatuh Tempo</option>
                            <option value="LUNAS">Lunas</option>
                            <option value="CLOSED">Ditutup</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <Table
                        data={loans}
                        columns={[
                            {
                                key: 'code',
                                header: 'Kode',
                                render: (loan) => (
                                    <span className="font-mono text-sm font-medium">{loan.code}</span>
                                ),
                            },
                            {
                                key: 'customer',
                                header: 'Nasabah',
                                render: (loan) => (
                                    <div>
                                        <p className="font-medium">{loan.customer?.fullName || '-'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {loan.collaterals?.length || 0} barang jaminan
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'principalRp',
                                header: 'Pokok Pinjaman',
                                render: (loan) => (
                                    <span className="font-medium">{formatCurrency(loan.principalRp)}</span>
                                ),
                            },
                            {
                                key: 'dates',
                                header: 'Tanggal',
                                render: (loan) => (
                                    <div className="text-sm">
                                        <p>Mulai: {formatDate(loan.startDate)}</p>
                                        <p className="text-gray-500">JT: {formatDate(loan.dueDate)}</p>
                                    </div>
                                ),
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (loan) => <LoanStatusBadge status={loan.status} />,
                            },
                            {
                                key: 'actions',
                                header: 'Aksi',
                                render: (loan) => (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/loans/${loan.id}`)}
                                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors duration-150"
                                            title="Lihat Detail"
                                        >
                                            <FiEye className="w-4 h-4" />
                                        </button>
                                        {loan.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => router.push(`/loans/${loan.id}/payment`)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                title="Bayar"
                                            >
                                                <FiDollarSign className="w-4 h-4" />
                                            </button>
                                        )}
                                        {(loan.status === 'LUNAS' || loan.status === 'CLOSED') && (
                                            <button
                                                onClick={() => openDeleteModal(loan.id, loan.code)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Hapus"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                        emptyMessage="Tidak ada data gadai"
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={loans.length * totalPages}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {loans.length === 0 ? (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data gadai</p>
                        </div>
                    ) : (
                        <>
                            {loans.map((loan) => (
                                <div
                                    key={loan.id}
                                    className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-medium">{loan.code}</span>
                                                <LoanStatusBadge status={loan.status} />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {loan.customer?.fullName || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Pokok:</span>
                                            <span className="font-semibold">{formatCurrency(loan.principalRp)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Mulai:</span>
                                            <span>{formatDate(loan.startDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Jatuh Tempo:</span>
                                            <span>{formatDate(loan.dueDate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => router.push(`/loans/${loan.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-colors duration-150"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            Detail
                                        </button>
                                        {loan.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => router.push(`/loans/${loan.id}/payment`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-success hover:bg-success/10 dark:hover:bg-success/20 rounded-xl transition-colors duration-150"
                                            >
                                                <FiDollarSign className="w-4 h-4" />
                                                Bayar
                                            </button>
                                        )}
                                        {(loan.status === 'LUNAS' || loan.status === 'CLOSED') && (
                                            <button
                                                onClick={() => openDeleteModal(loan.id, loan.code)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={loans.length * totalPages}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={confirmDelete}
                itemName={deleteModalState.code}
                loading={isDeleting}
                message="Menghapus gadai akan menghapus semua data terkait (Pembayaran, Cash Ledger, Lelang) secara permanen."
            />
        </AppLayout >
    );
}
