"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { CloseAuctionModal } from '@/components/auctions/CloseAuctionModal';
import { RecordSettlementModal } from '@/components/auctions/RecordSettlementModal';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FaGavel } from 'react-icons/fa';
import { FiArrowLeft, FiDollarSign, FiPackage, FiUser, FiCalendar, FiX, FiCheck, FiCreditCard } from 'react-icons/fi';
import Link from 'next/link';

type AuctionStatus = 'LISTED' | 'SOLD' | 'CANCELLED';

interface Settlement {
    id: string;
    grossAmountRp: number;
    feesRp: number;
    netAmountRp: number;
    settledAt: string;
    note?: string;
    createdBy: {
        fullName: string;
    };
}

interface Auction {
    id: string;
    loanId: string;
    branchId: string;
    status: AuctionStatus;
    listedAt: string;
    closedAt?: string;
    note?: string;
    dueDateSnapshot: string;
    daysUsedSnapshot: number;
    interestAmountSnapshotRp: number;
    totalDueSnapshotRp: number;
    remainingSnapshotRp: number;
    loan: {
        code: string;
        principalRp: number;
        customer?: {
            fullName: string;
            phone?: string;
            nik: string;
        };
        collaterals?: Array<{
            id: string;
            name: string;
            description?: string;
            estimatedValueRp?: number;
        }>;
    };
    createdBy: {
        fullName: string;
    };
    closedBy?: {
        fullName: string;
    };
    branch: {
        name: string;
    };
    AuctionSettlement?: Settlement[];
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

export default function AuctionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeStatus, setCloseStatus] = useState<'SOLD' | 'CANCELLED'>('SOLD');
    const [showSettlementModal, setShowSettlementModal] = useState(false);

    useEffect(() => {
        loadAuction();
    }, [params.id]);

    async function loadAuction() {
        try {
            setLoading(true);
            const res = await api.get(`/auctions/${params.id}`);
            setAuction(res.data);
        } catch (error: any) {
            console.error('Error loading auction:', error);
            toast.error('Gagal memuat data lelang', error.response?.data?.message || error.message);
            router.push('/auctions');
        } finally {
            setLoading(false);
        }
    }

    function handleOpenCloseModal(status: 'SOLD' | 'CANCELLED') {
        setCloseStatus(status);
        setShowCloseModal(true);
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data lelang..." />
            </AppLayout>
        );
    }

    if (!auction) {
        return null;
    }

    const totalCollateralValue = auction.loan.collaterals?.reduce(
        (sum, item) => sum + (item.estimatedValueRp || 0),
        0
    ) || 0;

    const hasSettlement = auction.AuctionSettlement !== undefined && auction.AuctionSettlement.length > 0;
    const settlement = auction.AuctionSettlement?.[0] ?? null;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <Link href="/auctions" className="flex-shrink-0">
                            <Button variant="ghost" leftIcon={<FiArrowLeft />} className="min-h-[44px]">
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {auction.loan.code}
                                </h1>
                                <span className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${statusColors[auction.status]}`}>
                                    {statusLabels[auction.status]}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {auction.loan.customer?.fullName || 'Nasabah tidak diketahui'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {auction.status === 'LISTED' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                leftIcon={<FiCheck />}
                                onClick={() => handleOpenCloseModal('SOLD')}
                                fullWidth
                                className="min-h-[48px] bg-green-600 hover:bg-green-700"
                            >
                                Tutup sebagai TERJUAL
                            </Button>
                            <Button
                                variant="secondary"
                                leftIcon={<FiX />}
                                onClick={() => handleOpenCloseModal('CANCELLED')}
                                fullWidth
                                className="min-h-[48px]"
                            >
                                Batalkan Lelang
                            </Button>
                        </div>
                    )}

                    {/* Settlement Button */}
                    {auction.status === 'SOLD' && !hasSettlement && (
                        <Button
                            leftIcon={<FiCreditCard />}
                            onClick={() => setShowSettlementModal(true)}
                            fullWidth
                            className="min-h-[48px] bg-blue-600 hover:bg-blue-700"
                        >
                            Catat ke Laporan
                        </Button>
                    )}
                </div>

                {/* Financial Snapshot */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <FiDollarSign className="w-5 h-5 flex-shrink-0" />
                            Keuangan
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pokok Pinjaman</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(auction.loan.principalRp)}
                                </p>
                            </div>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bunga</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(auction.interestAmountSnapshotRp)}
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hutang</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(auction.totalDueSnapshotRp)}
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sisa Hutang</p>
                                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(auction.remainingSnapshotRp)}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Settlement Info (if exists) */}
                {settlement && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                <FiCreditCard className="w-5 h-5 flex-shrink-0" />
                                Laporan Lelang
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Harga Jual</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(settlement.grossAmountRp)}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Biaya Lelang</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(settlement.feesRp)}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Jumlah Bersih (Masuk Kas)</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(settlement.netAmountRp)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(settlement.settledAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Dicatat Oleh</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{settlement.createdBy.fullName}</p>
                                </div>
                                {settlement.note && (
                                    <div className="lg:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Catatan</p>
                                        <p className="text-gray-900 dark:text-gray-100">{settlement.note}</p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Loan Info */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <FiUser className="w-5 h-5 flex-shrink-0" />
                            Informasi Gadai
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <dl className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kode Gadai</dt>
                                <dd className="mt-1">
                                    <Link href={`/loans/${auction.loanId}`} className="text-blue-600 hover:underline font-medium">
                                        {auction.loan.code}
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nasabah</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                                    {auction.loan.customer?.fullName || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">NIK</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {auction.loan.customer?.nik || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {auction.loan.customer?.phone || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cabang</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">{auction.branch.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Jatuh Tempo</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(auction.dueDateSnapshot)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hari Tunggakan</dt>
                                <dd className="mt-1 text-red-600 dark:text-red-400 font-semibold">
                                    {auction.daysUsedSnapshot} hari
                                </dd>
                            </div>
                        </dl>
                    </CardBody>
                </Card>

                {/* Collateral Items */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <FiPackage className="w-5 h-5 flex-shrink-0" />
                            <span>Barang Jaminan ({auction.loan.collaterals?.length || 0})</span>
                        </h2>
                    </CardHeader>
                    <CardBody>
                        {!auction.loan.collaterals || auction.loan.collaterals.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                Tidak ada barang jaminan
                            </p>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {auction.loan.collaterals.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {index + 1}. {item.name}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {item.estimatedValueRp && (
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Estimasi</p>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(item.estimatedValueRp)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            Total Estimasi Nilai:
                                        </span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(totalCollateralValue)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>

                {/* Auction Info */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <FiCalendar className="w-5 h-5 flex-shrink-0" />
                            Info Lelang
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <dl className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Terdaftar Pada</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(auction.listedAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dibuat Oleh</dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">{auction.createdBy.fullName}</dd>
                            </div>
                            {auction.closedAt && (
                                <>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ditutup Pada</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(auction.closedAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ditutup Oleh</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                            {auction.closedBy?.fullName || '-'}
                                        </dd>
                                    </div>
                                </>
                            )}
                            {auction.note && (
                                <div className="lg:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Catatan</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">{auction.note}</dd>
                                </div>
                            )}
                        </dl>
                    </CardBody>
                </Card>

                {/* Modals */}
                <CloseAuctionModal
                    auctionId={auction.id}
                    loanCode={auction.loan.code}
                    status={closeStatus}
                    isOpen={showCloseModal}
                    onClose={() => setShowCloseModal(false)}
                    onSuccess={loadAuction}
                />

                <RecordSettlementModal
                    auctionId={auction.id}
                    isOpen={showSettlementModal}
                    onClose={() => setShowSettlementModal(false)}
                    onSuccess={loadAuction}
                />
            </div>
        </AppLayout>
    );
}
