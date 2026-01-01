'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { PageLoader } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { FiEye, FiInfo } from 'react-icons/fi';

interface PaymentItem {
    id: string;
    amountRp: number;
    paidAt: string;
    createdAt: string;
    note?: string;
    loan: {
        id: string;
        code: string;
        customer: { fullName: string };
    };
    user: { fullName: string };
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, [page]);

    async function loadData() {
        try {
            setLoading(true);
            const res = await api.get('/payments', {
                params: { page, limit: 10 }
            });
            setPayments(res.data.data);
            setTotalPages(res.data.meta.totalPages);
        } catch (error) {
            console.error('Failed to load payments', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Pembayaran</h1>
                        <p className="text-sm text-gray-500">Semua riwayat pembayaran gadai</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8"><PageLoader /></div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table
                                    data={payments}
                                    columns={[
                                        {
                                            key: 'paidAt',
                                            header: 'Tanggal',
                                            render: (item) => formatDate(item.paidAt),
                                        },
                                        {
                                            key: 'createdAt',
                                            header: 'Waktu Aksi',
                                            render: (item) => (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(item.createdAt)}</span>
                                            ),
                                        },
                                        {
                                            key: 'loan',
                                            header: 'Kode Gadai',
                                            render: (item) => (
                                                <Link href={`/loans/${item.loan.id}`} className="font-mono text-primary font-medium hover:underline">
                                                    {item.loan.code}
                                                </Link>
                                            ),
                                        },
                                        {
                                            key: 'customer',
                                            header: 'Nasabah',
                                            render: (item) => item.loan.customer.fullName,
                                        },
                                        {
                                            key: 'amount',
                                            header: 'Jumlah',
                                            render: (item) => (
                                                <span className="font-bold text-success">{formatCurrency(item.amountRp)}</span>
                                            ),
                                        },
                                        {
                                            key: 'user',
                                            header: 'Petugas',
                                            render: (item) => item.user.fullName,
                                        },
                                        {
                                            key: 'actions',
                                            header: 'Aksi',
                                            render: (item) => (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => router.push(`/payments/${item.id}`)}
                                                >
                                                    <FiEye className="w-4 h-4 mr-2" /> Detail
                                                </Button>
                                            ),
                                        },
                                    ]}
                                />
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {payments.map((item) => (
                                    <div key={item.id} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <Link href={`/loans/${item.loan.id}`} className="font-mono text-xs font-bold text-primary mb-1 hover:underline block">
                                                    {item.loan.code}
                                                </Link>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {item.loan.customer.fullName}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatDate(item.paidAt)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-success text-lg">
                                                    {formatCurrency(item.amountRp)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Oleh: {item.user.fullName}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full text-xs h-9"
                                            onClick={() => router.push(`/payments/${item.id}`)}
                                        >
                                            Lihat Detail
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
