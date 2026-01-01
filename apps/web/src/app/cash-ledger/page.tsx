"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { CashLedgerEntry, CashLedgerListResponse, CashLedgerSummary, CashType } from '@/lib/types/cash-ledger';
import { formatDate, formatDateTime, formatCurrency, parseNumber } from '@/lib/utils';
import { FiSearch, FiTrendingUp, FiTrendingDown, FiDollarSign, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const sourceLabels: Record<string, string> = {
    LOAN_DISBURSEMENT: 'Pencairan Gadai',
    PAYMENT_PRINCIPAL: 'Bayar Pokok',
    PAYMENT_INTEREST: 'Bayar Bunga',
    PAYMENT_ADMIN_FEE: 'Bayar Admin',
    AUCTION_PROCEEDS: 'Hasil Lelang',
    MANUAL: 'Input Manual',
    PAYMENT: 'Pembayaran', // Fallback for generic payments
};

export default function CashLedgerPage() {
    const [entries, setEntries] = useState<CashLedgerEntry[]>([]);
    const [summary, setSummary] = useState<CashLedgerSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Manual Entry Form State
    const [showModal, setShowModal] = useState(false);
    const [manualType, setManualType] = useState<'IN' | 'OUT'>('OUT');
    const [manualAmount, setManualAmount] = useState('');
    const [manualTitle, setManualTitle] = useState('');
    const [manualNote, setManualNote] = useState('');
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, [currentPage, typeFilter, sourceFilter, startDate, endDate]);

    async function loadData() {
        try {
            setLoading(true);

            // 1. Load Summary with date filters
            const summaryParams = new URLSearchParams();
            if (startDate) summaryParams.append('from', startDate);
            if (endDate) summaryParams.append('to', endDate);

            const summaryRes = await api.get<CashLedgerSummary>(`/cash-ledger/summary?${summaryParams.toString()}`);
            setSummary(summaryRes.data);

            // 2. Load Entries with pagination and filters
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
            });

            if (startDate) params.append('from', startDate);
            if (endDate) params.append('to', endDate);
            if (sourceFilter !== 'ALL') params.append('source', sourceFilter);

            const entriesRes = await api.get<CashLedgerListResponse>(`/cash-ledger?${params.toString()}`);

            let data = entriesRes.data.data;

            // Client-side search filtering (if needed, though server-side is better for search)
            // Ideally search should be passed to server, but implementing simple local filter for now 
            // since backend might not support search param yet based on controller code view.
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                data = data.filter(e =>
                    e.title.toLowerCase().includes(query) ||
                    (e.note && e.note.toLowerCase().includes(query))
                );
            }

            // Client-side type filter (Backend supports it? Controller findAll doesn't seem to take type param in the viewed file)
            // The previous code had client-side type filtering, enabling it here again.
            if (typeFilter !== 'ALL') {
                data = data.filter(e => e.type === typeFilter);
            }

            setEntries(data);
            setTotalPages(entriesRes.data.meta.totalPages);
            setTotalItems(entriesRes.data.meta.total);
        } catch (error: any) {
            console.error('Error loading cash ledger:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat data kas');
        } finally {
            setLoading(false);
        }
    }

    async function handleManualEntry() {
        // Validation
        const amount = parseNumber(manualAmount);
        if (!amount || amount <= 0) {
            toast.error('Jumlah harus lebih dari 0');
            return;
        }

        if (!manualTitle || manualTitle.trim().length < 3) {
            toast.error('Deskripsi minimal 3 karakter');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/cash-ledger/manual', {
                type: manualType,
                amountRp: amount,
                title: manualTitle.trim(),
                note: manualNote.trim() || undefined,
                txnDate: new Date(manualDate).toISOString(),
                category: 'OPERATIONAL',
            });

            toast.success('Transaksi berhasil ditambahkan');
            closeModal();
            loadData();
        } catch (error: any) {
            console.error('Error creating manual entry:', error);
            toast.error(error.response?.data?.message || 'Gagal menambahkan transaksi');
        } finally {
            setSubmitting(false);
        }
    }

    function closeModal() {
        setShowModal(false);
        setManualAmount('');
        setManualTitle('');
        setManualNote('');
        setManualDate(new Date().toISOString().split('T')[0]);
    }

    function getTypeBadgeVariant(type: CashType) {
        return type === 'IN' ? 'success' : 'danger';
    }

    function formatLedgerTitle(title: string, entry?: CashLedgerEntry) {
        if (!title) return title;

        // 1. Use Loan Code if available (New logic)
        // @ts-ignore - entry might not be passed in old calls or types might be partial
        if (entry?.payment?.loan?.code) {
            // @ts-ignore
            return `Pembayaran Gadai (${entry.payment.loan.code})`;
        }

        let formatted = title;

        // 2. Translate Patterns (Legacy Fallback)
        // "Payment Loan [Code]"
        const paymentMatch = formatted.match(/^Payment Loan\s+(.+)$/i);
        if (paymentMatch) formatted = `Pembayaran Gadai ${paymentMatch[1]}`;

        // "Reversal Payment [ID]" or just "Reversal Payment"
        if (formatted === 'Reversal Payment') formatted = 'Pembatalan Pembayaran';
        const reversalMatch = formatted.match(/^Reversal Payment\s+(.+)$/i);
        if (reversalMatch) formatted = `Pembatalan Pembayaran ${reversalMatch[1]}`;

        // "Settlement Auction [ID]"
        const auctionMatch = formatted.match(/^Settlement Auction\s+(.+)$/i);
        if (auctionMatch) formatted = `Pelunasan Lelang ${auctionMatch[1]}`;

        if (formatted === 'Manual Entry') formatted = 'Input Manual';

        // 2. Truncate UUIDs (generic)
        // Regex for UUID: 8-4-4-4-12 hex chars
        formatted = formatted.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, (match) => {
            return `${match.substring(0, 8)}...`;
        });

        return formatted;
    }

    function formatLedgerNote(note?: string) {
        if (!note) return '';

        let formatted = note;

        // 1. Translate Patterns
        // "Auto from payment [ID]"
        const autoMatch = formatted.match(/^Auto from payment\s+(.+)$/i);
        if (autoMatch) formatted = `Otomatis dari pembayaran ${autoMatch[1]}`;

        // "Auto from auction settlement [ID]"
        const autoAuctionMatch = formatted.match(/^Auto from auction settlement\s+(.+)$/i);
        if (autoAuctionMatch) formatted = `Otomatis dari pelunasan lelang ${autoAuctionMatch[1]}`;

        // "LOAN DISBURSEMENT ..."
        if (formatted.includes('LOAN DISBURSEMENT')) {
            formatted = formatted
                .replace('LOAN DISBURSEMENT', 'PENCAIRAN GADAI')
                .replace(/Principal:/g, 'Pokok:')
                .replace(/Admin Fee:/g, 'Admin:');
        }

        // 2. Truncate UUIDs
        formatted = formatted.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, (match) => {
            return `${match.substring(0, 8)}...`;
        });

        return formatted;
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (loading && entries.length === 0) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data kas..." />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Kas & Ledger
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Catatan arus kas masuk dan keluar
                        </p>
                    </div>

                    <Button
                        onClick={() => setShowModal(true)}
                        variant="primary"
                        leftIcon={<FiPlus />}
                        fullWidth
                        className="sm:w-auto"
                    >
                        Tambah Transaksi
                    </Button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-success/10 rounded-2xl">
                                    <FiTrendingUp className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Masuk</p>
                                    <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalIn)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-danger/10 rounded-2xl">
                                    <FiTrendingDown className="w-6 h-6 text-danger" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Keluar</p>
                                    <p className="text-2xl font-bold text-danger">{formatCurrency(summary.totalOut)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <FiDollarSign className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Akhir</p>
                                    <p className="text-2xl font-bold text-primary">{formatCurrency(summary.balance)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Search Input - 4 cols */}
                        <div className="md:col-span-4 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari judul..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Date Filters - 2 cols each */}
                        <div className="md:col-span-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                placeholder="Mulai"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                placeholder="Sampai"
                            />
                        </div>

                        {/* Type Filter - 2 cols */}
                        <div className="md:col-span-2">
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100 transition-colors duration-150 text-sm"
                            >
                                <option value="ALL">Semua Tipe</option>
                                <option value="IN">Masuk</option>
                                <option value="OUT">Keluar</option>
                            </select>
                        </div>

                        {/* Source Filter - 2 cols */}
                        <div className="md:col-span-2">
                            <select
                                value={sourceFilter}
                                onChange={(e) => {
                                    setSourceFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100 transition-colors duration-150 text-sm"
                            >
                                <option value="ALL">Semua Sumber</option>
                                <option value="MANUAL">Manual</option>
                                <option value="SYSTEM">Otomatis</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <Table
                        data={entries}
                        columns={[
                            {
                                key: 'txnDate',
                                header: 'Tanggal',
                                render: (entry) => (
                                    <span className="text-sm font-medium">{formatDate(entry.txnDate)}</span>
                                ),
                            },
                            {
                                key: 'createdAt',
                                header: 'Waktu Aksi',
                                render: (entry) => (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(entry.createdAt)}</span>
                                ),
                            },
                            {
                                key: 'type',
                                header: 'Tipe',
                                render: (entry) => (
                                    <Badge variant={getTypeBadgeVariant(entry.type)} size="sm">
                                        {entry.type === 'IN' ? 'MASUK' : 'KELUAR'}
                                    </Badge>
                                ),
                            },
                            {
                                key: 'source',
                                header: 'Sumber',
                                render: (entry) => (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {sourceLabels[entry.source] || entry.source}
                                    </span>
                                ),
                            },
                            {
                                key: 'title',
                                header: 'Keterangan',
                                render: (entry) => (
                                    <div>
                                        {entry.paymentId ? (
                                            <Link href={`/payments/${entry.paymentId}`} className="font-medium text-primary hover:underline block">
                                                {formatLedgerTitle(entry.title, entry)}
                                            </Link>
                                        ) : (
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatLedgerTitle(entry.title, entry)}</p>
                                        )}
                                        {entry.note && (
                                            <p className="text-xs text-gray-500 mt-0.5">{formatLedgerNote(entry.note)}</p>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'amount',
                                header: 'Jumlah',
                                render: (entry) => (
                                    <span className={`font-semibold ${entry.type === 'IN' ? 'text-success' : 'text-danger'}`}>
                                        {entry.type === 'IN' ? '+' : '-'} {formatCurrency(entry.amountRp)}
                                    </span>
                                ),
                            },
                        ]}
                        emptyMessage="Tidak ada data transaksi kas"
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
                    {entries.length === 0 ? (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Tidak ada data transaksi kas</p>
                        </div>
                    ) : (
                        <>
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getTypeBadgeVariant(entry.type)} size="sm">
                                                    {entry.type === 'IN' ? 'MASUK' : 'KELUAR'}
                                                </Badge>
                                            </div>
                                            <p className="font-medium mt-2 text-gray-900 dark:text-gray-100">{formatLedgerTitle(entry.title, entry)}</p>
                                            <p className="text-xs text-gray-500 mt-1">{sourceLabels[entry.source] || entry.source}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                                            <span>{formatDate(entry.txnDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Waktu Aksi:</span>
                                            <span className="text-xs">{formatDateTime(entry.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Keterangan:</span>
                                            <span className="text-right text-xs max-w-[200px]">{formatLedgerNote(entry.note)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Jumlah:</span>
                                            <span className={`font-bold ${entry.type === 'IN' ? 'text-success' : 'text-danger'}`}>
                                                {entry.type === 'IN' ? '+' : '-'} {formatCurrency(entry.amountRp)}
                                            </span>
                                        </div>
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

                {/* Manual Entry Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tambah Transaksi Manual</h2>

                            <div className="space-y-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Transaksi</label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setManualType('OUT')}
                                            className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200 font-medium ${manualType === 'OUT'
                                                ? 'border-danger bg-danger/10 text-danger'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setManualType('IN')}
                                            className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all duration-200 font-medium ${manualType === 'IN'
                                                ? 'border-success bg-success/10 text-success'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            Pemasukan
                                        </button>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah (Rp)</label>
                                    <Input
                                        type="text"
                                        placeholder="Rp 0"
                                        value={manualAmount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const numericVal = parseNumber(val);
                                            if (val === '' || numericVal === 0) {
                                                setManualAmount('');
                                            } else {
                                                setManualAmount(formatCurrency(numericVal));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keterangan</label>
                                    <Input
                                        type="text"
                                        placeholder={manualType === 'OUT' ? 'Contoh: Bayar Listrik' : 'Contoh: Tambahan Modal'}
                                        value={manualTitle}
                                        onChange={(e) => setManualTitle(e.target.value)}
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal Transaksi</label>
                                    <Input
                                        type="date"
                                        value={manualDate}
                                        onChange={(e) => setManualDate(e.target.value)}
                                    />
                                </div>

                                {/* Note (optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan Tambahan (Opsional)</label>
                                    <textarea
                                        placeholder="Tulis catatan di sini..."
                                        value={manualNote}
                                        onChange={(e) => setManualNote(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <Button
                                    onClick={closeModal}
                                    variant="ghost"
                                    disabled={submitting}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleManualEntry}
                                    variant="primary"
                                    disabled={submitting}
                                    className="flex-1"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
