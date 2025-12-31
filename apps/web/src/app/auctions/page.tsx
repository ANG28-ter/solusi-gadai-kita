"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FaGavel } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import Link from 'next/link';

type AuctionStatus = 'LISTED' | 'SOLD' | 'CANCELLED';

interface Auction {
    id: string;
    loanId: string;
    status: AuctionStatus;
    listedAt: string;
    closedAt?: string;
    remainingSnapshotRp: number;
    daysUsedSnapshot: number;
    loan: {
        code: string;
        customer?: {
            fullName: string;
        };
    };
}

const statusColors: Record<AuctionStatus, string> = {
    LISTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    SOLD: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
};

const statusLabels: Record<AuctionStatus, string> = {
    LISTED: 'Terdaftar',
    SOLD: 'Terjual',
    CANCELLED: 'Dibatalkan',
};

export default function AuctionsPage() {
    const toast = useToast();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AuctionStatus | 'ALL'>('ALL');

    useEffect(() => {
        loadAuctions();
    }, [statusFilter]);

    async function loadAuctions() {
        try {
            setLoading(true);
            const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
            const res = await api.get(`/auctions${params}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setAuctions(data);
        } catch (error: any) {
            console.error('Error loading auctions:', error);
            toast.error('Gagal memuat data lelang', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data lelang..." />
            </AppLayout>
        );
    }

    const filteredAuctions = auctions;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <FaGavel className="w-7 h-7 text-primary" />
                            Daftar Lelang
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Kelola lelang barang jaminan
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardBody>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <FiFilter className="hidden sm:block w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-2 flex-1">
                                {(['ALL', 'LISTED', 'SOLD', 'CANCELLED'] as const).map((status) => (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? 'primary' : 'secondary'}
                                        onClick={() => setStatusFilter(status)}
                                        className="min-h-[44px]"
                                    >
                                        {status === 'ALL' ? 'Semua' : statusLabels[status]}
                                    </Button>
                                ))}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {filteredAuctions.length} lelang
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Auctions List */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold">
                            {statusFilter === 'ALL' ? 'Semua Lelang' : statusLabels[statusFilter]}
                        </h2>
                    </CardHeader>
                    <CardBody>
                        {filteredAuctions.length === 0 ? (
                            <div className="text-center py-12">
                                <FaGavel className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Tidak ada lelang{statusFilter !== 'ALL' && ` dengan status ${statusLabels[statusFilter]}`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAuctions.map((auction) => (
                                    <Link
                                        key={auction.id}
                                        href={`/auctions/${auction.id}`}
                                        className="block p-6 border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-primary/30 transition-all duration-150"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            {/* Left: Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                {/* Loan Code & Status */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                                        {auction.loan.code}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[auction.status]}`}>
                                                        {statusLabels[auction.status]}
                                                    </span>
                                                </div>

                                                {/* Customer */}
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {auction.loan.customer?.fullName || 'Nasabah tidak diketahui'}
                                                </p>

                                                {/* Dates */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>Terdaftar: {formatDate(auction.listedAt)}</span>
                                                    {auction.closedAt && (
                                                        <span>Ditutup: {formatDate(auction.closedAt)}</span>
                                                    )}
                                                    <span>{auction.daysUsedSnapshot} hari tunggakan</span>
                                                </div>
                                            </div>

                                            {/* Right: Amount */}
                                            <div className="flex flex-col items-start sm:items-end gap-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Sisa Hutang
                                                </span>
                                                <span className="text-lg sm:text-xl font-bold text-danger dark:text-danger">
                                                    {formatCurrency(auction.remainingSnapshotRp)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
