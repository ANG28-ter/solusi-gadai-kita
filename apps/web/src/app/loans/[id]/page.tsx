"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { LoanStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { FinalizeLoanModal } from '@/components/loans/FinalizeLoanModal';
import { AddDecisionModal } from '@/components/loans/AddDecisionModal';
import { ReversePaymentModal } from '@/components/loans/ReversePaymentModal';
import { CreateAuctionModal } from '@/components/loans/CreateAuctionModal';
import { api } from '@/lib/api';
import { Loan, Payment, CollateralItem } from '@/lib/types';
import { formatDate, formatCurrency, daysBetween } from '@/lib/utils';
import { getInterestTierInfo, getDaysUsedProgress, getDaysUsedColorClass, formatDaysUsed } from '@/lib/loan-utils';
import { FiArrowLeft, FiDollarSign, FiPackage, FiCalendar, FiUser, FiPercent, FiTrendingUp, FiLock, FiShoppingCart } from 'react-icons/fi';
import { FaGavel } from 'react-icons/fa';
import Link from 'next/link';

export default function LoanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [collaterals, setCollaterals] = useState<CollateralItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showReverseModal, setShowReverseModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [remaining, setRemaining] = useState<any>(null);
    const [hasAuction, setHasAuction] = useState(false);
    const [latestDecision, setLatestDecision] = useState<string | null>(null);
    const [creatingAuction, setCreatingAuction] = useState(false);
    const [showCreateAuctionModal, setShowCreateAuctionModal] = useState(false);

    useEffect(() => {
        loadLoanData();
    }, [params.id]);

    async function loadLoanData() {
        try {
            setLoading(true);

            // Get loan from findAll endpoint and filter by ID
            const loansRes = await api.get(`/loans`);
            let allLoans = Array.isArray(loansRes.data) ? loansRes.data : (loansRes.data?.data || []);
            const loanData = allLoans.find((l: Loan) => l.id === params.id);

            if (!loanData) {
                throw new Error('Loan not found');
            }

            setLoan(loanData);

            // Get payments from specific endpoint
            try {
                // Correct endpoint: /payments?loanId=...
                const paymentsRes = await api.get('/payments', {
                    params: { loanId: params.id }
                });
                const paymentsData = Array.isArray(paymentsRes.data)
                    ? paymentsRes.data
                    : (paymentsRes.data?.data || []);
                setPayments(paymentsData);
            } catch (err) {
                console.log('No payments found:', err);
                setPayments([]);
            }

            // Get collaterals - try from loan data first
            if (loanData.collaterals) {
                setCollaterals(Array.isArray(loanData.collaterals) ? loanData.collaterals : []);
            } else {
                setCollaterals([]);
            }

            // Get remaining balance calculation
            if (loanData.status === 'ACTIVE' || loanData.status === 'OVERDUE') {
                try {
                    const remainingRes = await api.get(`/loans/${params.id}/remaining`);
                    setRemaining(remainingRes.data);
                } catch (err) {
                    console.log('Could not fetch remaining balance:', err);
                    setRemaining(null);
                }
            }

            // Check for existing auction (exclude CANCELLED - can be re-listed)
            try {
                // Fetch all auctions (filtered by branch in backend), then find for this loan.
                // Ideally backend should support filtering by loanId. Assuming it does or we filter client side.
                // Based on controller, it supports status but not explicit loanId filter yet?
                // Let's keep it as /auctions for now but maybe try passing loanId if we update backend later.
                // Actually to avoid 404/Refused if path was wrong:
                const auctionsRes = await api.get('/auctions');
                const allAuctions = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data?.data || []);
                const loanAuction = allAuctions.find((a: any) => a.loanId === params.id);
                // Only consider LISTED or SOLD as "has auction" - CANCELLED can be re-listed
                setHasAuction(loanAuction && (loanAuction.status === 'LISTED' || loanAuction.status === 'SOLD'));
            } catch (err) {
                console.log('Could not fetch auctions:', err);
                setHasAuction(false);
            }

            // Get latest decision
            try {
                const decisionsRes = await api.get(`/loans/${params.id}/decisions`);
                const decisions = Array.isArray(decisionsRes.data) ? decisionsRes.data : (decisionsRes.data?.data || []);
                if (decisions.length > 0) {
                    const latest = decisions[decisions.length - 1];
                    setLatestDecision(latest.decision);
                } else {
                    setLatestDecision(null);
                }
            } catch (err) {
                console.log('Could not fetch decisions:', err);
                setLatestDecision(null);
            }

        } catch (error: any) {
            console.error('Error loading loan:', error);
            toast.error('Gagal memuat data gadai', error.response?.data?.message || error.message);
            router.push('/loans');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAuction() {
        if (!loan) return;

        try {
            setCreatingAuction(true);
            const res = await api.post(`/loans/${loan.id}/auction`);
            toast.success('Lelang berhasil dibuat');
            setShowCreateAuctionModal(false);
            // Redirect to auction detail
            router.push(`/auctions/${res.data.auctionId}`);
        } catch (error: any) {
            console.error('Error creating auction:', error);
            toast.error('Gagal membuat lelang', error.response?.data?.message || error.message);
        } finally {
            setCreatingAuction(false);
        }
    }


    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data gadai..." />
            </AppLayout>
        );
    }

    if (!loan) {
        return null;
    }

    // Calculate totals
    const totalPaid = payments
        .filter(p => !p.reversedAt)
        .reduce((sum, p) => sum + p.amountRp, 0);

    const daysElapsed = daysBetween(loan.startDate, new Date());
    const daysRemaining = daysBetween(new Date(), loan.dueDate);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                {/* Header - Mobile Optimized */}
                <div className="flex flex-col gap-4">
                    {/* Title & Back Button */}
                    <div className="flex items-start gap-3">
                        <Link href="/loans" className="flex-shrink-0">
                            <Button variant="ghost" leftIcon={<FiArrowLeft />} className="min-h-[44px]">
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {loan.code}
                                </h1>
                                <LoanStatusBadge status={loan.status} />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {loan.customer?.fullName}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {/* Edit button - only if no payments and not finalized */}
                        {!loan.finalizedAt && payments.length === 0 && (
                            <Link href={`/loans/${loan.id}/edit`} className="w-full">
                                <Button
                                    variant="secondary"
                                    leftIcon={<FiArrowLeft className="rotate-180" />}
                                    fullWidth
                                    className="min-h-[48px]"
                                >
                                    Edit Gadai
                                </Button>
                            </Link>
                        )}

                        {loan.status === 'ACTIVE' && (
                            <>
                                <Link href={`/loans/${loan.id}/payment`} className="w-full">
                                    <Button
                                        leftIcon={<FiDollarSign />}
                                        fullWidth
                                        className="min-h-[48px]"
                                    >
                                        Bayar Angsuran
                                    </Button>
                                </Link>
                                <Button
                                    variant="secondary"
                                    leftIcon={<FiLock />}
                                    onClick={() => setShowFinalizeModal(true)}
                                    fullWidth
                                    className="min-h-[48px]"
                                >
                                    Buat Kontrak
                                </Button>
                            </>
                        )}
                        {loan.status === 'OVERDUE' && (
                            <>
                                <Link href={`/loans/${loan.id}/payment`} className="w-full">
                                    <Button
                                        leftIcon={<FiDollarSign />}
                                        fullWidth
                                        className="min-h-[48px]"
                                    >
                                        Bayar Angsuran
                                    </Button>
                                </Link>
                                <Button
                                    variant="secondary"
                                    leftIcon={<FaGavel />}
                                    onClick={() => setShowDecisionModal(true)}
                                    fullWidth
                                    className="min-h-[48px]"
                                >
                                    Tambah Keputusan
                                </Button>
                                {latestDecision === 'AUCTION' && !hasAuction && (
                                    <Button
                                        leftIcon={<FiShoppingCart />}
                                        onClick={() => setShowCreateAuctionModal(true)}
                                        fullWidth
                                        className="min-h-[48px] bg-orange-600 hover:bg-orange-700"
                                    >
                                        Buat Lelang
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <FinalizeLoanModal
                    loan={loan}
                    isOpen={showFinalizeModal}
                    onClose={() => setShowFinalizeModal(false)}
                    onSuccess={loadLoanData}
                />
                <AddDecisionModal
                    loan={loan}
                    isOpen={showDecisionModal}
                    onClose={() => setShowDecisionModal(false)}
                    onSuccess={loadLoanData}
                />
                {selectedPayment && (
                    <ReversePaymentModal
                        payment={selectedPayment}
                        loanId={loan.id}
                        isOpen={showReverseModal}
                        onClose={() => {
                            setShowReverseModal(false);
                            setSelectedPayment(null);
                        }}
                        onSuccess={loadLoanData}
                    />
                )}
                <CreateAuctionModal
                    loanCode={loan.code}
                    remainingAmount={remaining?.remaining?.totalRp || 0}
                    isOpen={showCreateAuctionModal}
                    onClose={() => setShowCreateAuctionModal(false)}
                    onConfirm={handleCreateAuction}
                    isCreating={creatingAuction}
                />

                {/* Summary Cards */}
                {/* Summary Cards - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <FiDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pokok Pinjaman</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(loan.principalRp)}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Dibayar</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(totalPaid)}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Lama Gadai</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{remaining?.daysUsed || 0} hari</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sisa Hari</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{remaining && remaining.daysUsed !== undefined ? Math.max(0, 30 - remaining.daysUsed) : 0} hari</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Progress Waktu</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {remaining ? Math.round((remaining.daysUsed / 30) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${remaining && remaining.daysUsed > 30
                                            ? 'bg-danger'
                                            : remaining && remaining.daysUsed > 15
                                                ? 'bg-warning'
                                                : 'bg-success'
                                            }`}
                                        style={{ width: `${remaining ? Math.min((remaining.daysUsed / 30) * 100, 100) : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Hari ke-1</span>
                                    <span>Hari ke-30</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Interest Calculation Summary */}
                {remaining && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                    <FiPercent className="w-5 h-5 flex-shrink-0" />
                                    <span className="truncate">Perhitungan Bunga</span>
                                </h2>
                                <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto whitespace-nowrap ${remaining.daysUsed <= 15
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : remaining.daysUsed <= 30
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                    }`}>
                                    {getInterestTierInfo(remaining.daysUsed).ratePercent} / {getInterestTierInfo(remaining.daysUsed).description}
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-6">
                                {/* Calculation Breakdown - Mobile Optimized */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Total Due */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <FiTrendingUp className="w-4 h-4" />
                                            Total Yang Harus Dibayar
                                        </h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Pokok Pinjaman:</span>
                                                <span className="font-medium">{formatCurrency(remaining.principalRp)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Bunga ({remaining.interestRatePercent}%):
                                                </span>
                                                <span className="font-medium">{formatCurrency(remaining.interestAmountRp)}</span>
                                            </div>
                                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(remaining.totalDueRp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <FiDollarSign className="w-4 h-4" />
                                            Status Pembayaran
                                        </h3>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Bunga Dibayar:</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {formatCurrency(remaining.paid.interestRp)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Pokok Dibayar:</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {formatCurrency(remaining.paid.principalRp)}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-green-200 dark:border-green-800">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">Total Dibayar:</span>
                                                    <span className="font-bold text-green-600 dark:text-green-400">
                                                        {formatCurrency(remaining.paid.totalRp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Remaining Balance */}
                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                    <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-3">
                                        Sisa Yang Harus Dibayar
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-1">Sisa Bunga:</p>
                                            <p className="font-bold text-orange-700 dark:text-orange-300">
                                                {formatCurrency(remaining.remaining.interestRp)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-1">Sisa Pokok:</p>
                                            <p className="font-bold text-orange-700 dark:text-orange-300">
                                                {formatCurrency(remaining.remaining.principalRp)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-1">Total Sisa:</p>
                                            <p className="font-bold text-lg text-orange-900 dark:text-orange-100">
                                                {formatCurrency(remaining.remaining.totalRp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Loan Info */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FiUser className="w-5 h-5" />
                            Informasi Gadai
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Nasabah
                                </dt>
                                <dd className="mt-1">
                                    <Link
                                        href={`/customers/${loan.customerId}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {loan.customer?.fullName}
                                    </Link>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Cabang
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {loan.branch?.name || '-'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tanggal Mulai
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(loan.startDate)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tanggal Jatuh Tempo
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(loan.dueDate)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tenor (Jangka Waktu)
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {Math.ceil((new Date(loan.dueDate).getTime() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24))} hari
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Biaya Admin
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatCurrency(loan.adminFeeRp || 0)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Dibuat Oleh
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {loan.createdBy?.fullName || '-'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tanggal Dibuat
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(loan.createdAt)}
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
                            <span className="truncate">Barang Jaminan ({collaterals.length})</span>
                        </h2>
                    </CardHeader>
                    <CardBody>
                        {collaterals.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                Tidak ada barang jaminan
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {collaterals.map((item, index) => (
                                    <Link
                                        key={item.id}
                                        href={`/collaterals/${item.id}`}
                                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between">
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
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Estimasi Nilai
                                                    </p>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(item.estimatedValueRp)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg sm:text-xl font-semibold">Riwayat Pembayaran ({payments.length})</h2>
                    </CardHeader>
                    <CardBody>
                        {payments.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                Belum ada pembayaran
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className={`p-4 border rounded-lg ${payment.reversedAt
                                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                            <Link href={`/payments/${payment.id}`} className="flex-1 min-w-0 group cursor-pointer">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                                                        {formatCurrency(payment.amountRp)}
                                                    </p>
                                                    {payment.reversedAt && (
                                                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded whitespace-nowrap">
                                                            Dibatalkan
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {formatDate(payment.paidAt)} • {payment.user?.fullName}
                                                </p>
                                                {payment.note && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {payment.note}
                                                    </p>
                                                )}
                                                <div className="mt-1 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Lihat Detail <FiArrowLeft className="rotate-180 w-3 h-3" />
                                                </div>
                                            </Link>
                                            {!payment.reversedAt && (
                                                <Button
                                                    variant="danger"
                                                    className="min-h-[44px] min-w-[100px] w-full sm:w-auto"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setShowReverseModal(true);
                                                    }}
                                                >
                                                    Batalkan
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
