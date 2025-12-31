"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { ContractListItem, ContractListResponse } from '@/lib/types/contract';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiSearch, FiEye, FiFileText } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<ContractListItem[]>([]);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const toast = useToast();
    const router = useRouter();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedQuery, statusFilter]);

    async function loadContracts() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
            });

            if (debouncedQuery) {
                params.append('search', debouncedQuery);
            }

            if (statusFilter !== 'ALL') {
                params.append('status', statusFilter);
            }

            const response = await api.get<ContractListResponse>(`/contracts?${params.toString()}`);
            setContracts(response.data.data);
            setTotalPages(response.data.meta.totalPages);
            setTotalItems(response.data.meta.total);
        } catch (error: any) {
            console.error('Error loading contracts:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat data kontrak');
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadgeVariant(status: string) {
        switch (status) {
            case 'FINAL':
                return 'success';
            case 'VOID':
                return 'danger';
            default:
                return 'default';
        }
    }

    if (loading && contracts.length === 0) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data kontrak..." />
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
                            Kontrak (SBG)
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Daftar Surat Bukti Gadai
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari nomor kontrak, nama nasabah, atau kode gadai..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100 transition-colors duration-150"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="FINAL">Final</option>
                            <option value="VOID">Dibatalkan</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table
                        data={contracts}
                        columns={[
                            {
                                key: 'contractNo',
                                header: 'No. Kontrak',
                                render: (contract) => (
                                    <span className="font-mono font-medium">{contract.contractNo}</span>
                                ),
                            },
                            {
                                key: 'customer',
                                header: 'Nasabah',
                                render: (contract) => (
                                    <div>
                                        <div className="font-medium">{contract.loan.customer.fullName}</div>
                                        <div className="text-sm text-gray-500">NIK: {contract.loan.customer.nik}</div>
                                    </div>
                                ),
                            },
                            {
                                key: 'loanCode',
                                header: 'Kode Gadai',
                                render: (contract) => (
                                    <Link href={`/loans/${contract.loan.id}`} className="text-primary hover:underline font-mono">
                                        {contract.loan.code}
                                    </Link>
                                ),
                            },
                            {
                                key: 'principal',
                                header: 'Pokok',
                                render: (contract) => (
                                    <span className="font-semibold">{formatCurrency(contract.loan.principalRp)}</span>
                                ),
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (contract) => (
                                    <Badge variant={getStatusBadgeVariant(contract.status)}>
                                        {contract.status === 'FINAL' ? 'Final' : 'Dibatalkan'}
                                    </Badge>
                                ),
                            },
                            {
                                key: 'finalizedAt',
                                header: 'Tanggal',
                                render: (contract) => (
                                    <span>{contract.finalizedAt ? formatDate(contract.finalizedAt) : '-'}</span>
                                ),
                            },
                            {
                                key: 'actions',
                                header: 'Aksi',
                                render: (contract) => (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/contracts/${contract.id}`)}
                                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors duration-150"
                                            title="Lihat Kontrak"
                                        >
                                            <FiEye className="w-4 h-4" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        emptyMessage="Tidak ada data kontrak"
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {contracts.length === 0 ? (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data kontrak</p>
                        </div>
                    ) : (
                        <>
                            {contracts.map((contract) => (
                                <div
                                    key={contract.id}
                                    className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-medium">{contract.contractNo}</span>
                                                <Badge variant={getStatusBadgeVariant(contract.status)} size="sm">
                                                    {contract.status === 'FINAL' ? 'Final' : 'Dibatalkan'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {contract.loan.customer.fullName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Kode Gadai:</span>
                                            <Link href={`/loans/${contract.loan.id}`} className="text-blue-600 hover:underline font-mono">
                                                {contract.loan.code}
                                            </Link>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Pokok:</span>
                                            <span className="font-semibold">{formatCurrency(contract.loan.principalRp)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                                            <span>{contract.finalizedAt ? formatDate(contract.finalizedAt) : '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => router.push(`/contracts/${contract.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <FiFileText className="w-4 h-4" />
                                            Lihat Kontrak
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
