"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { ReportSubmission, ReviewReportPayload } from '@/lib/types/report-submission';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiCheckCircle, FiXCircle, FiClock, FiFileText, FiPrinter } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SubmissionDetailPage() {
    const params = useParams();
    const [submission, setSubmission] = useState<ReportSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'REVISED'>('APPROVED');
    const [reviewNote, setReviewNote] = useState('');
    const toast = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const id = params?.id as string;

    useEffect(() => {
        if (id) {
            loadSubmission();
        }
    }, [id]);

    async function loadSubmission() {
        try {
            setLoading(true);
            const response = await api.get<ReportSubmission>(`/reports/submissions/${id}`);
            setSubmission(response.data);
        } catch (error: any) {
            console.error('Error loading submission:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat detail laporan');
        } finally {
            setLoading(false);
        }
    }

    async function submitReview() {
        try {
            setReviewing(true);
            const payload: ReviewReportPayload = {
                status: reviewStatus,
                reviewNote: reviewNote || undefined,
            };

            await api.patch(`/reports/submissions/${id}/review`, payload);
            toast.success(`Laporan berhasil ${reviewStatus === 'APPROVED' ? 'disetujui' : 'ditolak'}!`);
            setShowReviewModal(false);
            loadSubmission();
        } catch (error: any) {
            console.error('Error reviewing submission:', error);
            toast.error(error.response?.data?.message || 'Gagal mereview laporan');
        } finally {
            setReviewing(false);
        }
    }

    if (loading || !submission) {
        return (
            <AppLayout>
                <PageLoader message="Memuat detail laporan..." />
            </AppLayout>
        );
    }

    const discrepancy = submission.physicalCashRp - submission.reportData.summary.saldoRp;

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Hide non-essential elements */
                    .no-print,
                    nav,
                    aside,
                    footer,
                    button {
                        display: none !important;
                    }

                    /* Force white background */
                    body {
                        background: white !important;
                        color: black !important;
                    }

                    /* Page formatting */
                    @page {
                        size: A4;
                        margin: 2cm;
                    }

                    /* Remove shadows and borders for cleaner print */
                    .shadow-sm,
                    .shadow-xl {
                        box-shadow: none !important;
                    }

                    .border {
                        border-color: #e5e7eb !important;
                    }

                    /* Ensure content fits */
                    .overflow-hidden {
                        overflow: visible !important;
                    }

                    /* Table styling for print */
                    table {
                        page-break-inside: auto;
                    }

                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }

                    /* Adjust text colors for print */
                    .text-gray-900,
                    .text-gray-100,
                    .dark\\:text-gray-100 {
                        color: #111827 !important;
                    }

                    .text-gray-600,
                    .text-gray-500,
                    .dark\\:text-gray-400 {
                        color: #6b7280 !important;
                    }

                    /* Card backgrounds */
                    .dark\\:bg-\\[\\#1A1F2E\\],
                    .dark\\:bg-slate-700,
                    .bg-gray-50 {
                        background: white !important;
                    }
                }
            `}</style>
            <AppLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Detail Laporan Setoran
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {formatDate(submission.periodStart)} - {formatDate(submission.periodEnd)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 no-print">
                            <button
                                onClick={() => router.push(`/reports/submissions/${id}/print`)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <FiPrinter className="w-4 h-4" />
                                <span>Cetak Laporan</span>
                            </button>
                            <Badge
                                variant={
                                    submission.status === 'APPROVED' ? 'success' :
                                        submission.status === 'REJECTED' ? 'danger' :
                                            'default'
                                }
                                size="md"
                            >
                                {submission.status === 'APPROVED' ? 'Disetujui' :
                                    submission.status === 'REJECTED' ? 'Ditolak' :
                                        submission.status === 'REVISED' ? 'Perlu Revisi' :
                                            'Menunggu Review'}
                            </Badge>
                        </div>
                    </div>

                    {/* Submission Info */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Informasi Setoran
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Disetor oleh</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                                    {submission.submitter.fullName}
                                </p>
                                <p className="text-sm text-gray-500">@{submission.submitter.username}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Setor</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                                    {formatDate(submission.submittedAt)}
                                </p>
                            </div>
                            {submission.note && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Catatan</p>
                                    <p className="text-gray-900 dark:text-gray-100 mt-1">{submission.note}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cash Verification */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Verifikasi Kas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-primary/5 rounded-2xl">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Sistem</p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(submission.reportData.summary.saldoRp)}
                                </p>
                            </div>
                            <div className="p-4 bg-success/5 rounded-2xl">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Kas Fisik</p>
                                <p className="text-2xl font-bold text-success">
                                    {formatCurrency(submission.physicalCashRp)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl ${Math.abs(discrepancy) < 1000 ? 'bg-success/10' : 'bg-warning/10'
                                }`}>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Selisih</p>
                                <p className={`text-2xl font-bold ${Math.abs(discrepancy) < 1000 ? 'text-success' : 'text-warning'
                                    }`}>
                                    {discrepancy >= 0 ? '+' : ''}{formatCurrency(discrepancy)}
                                </p>
                                {Math.abs(discrepancy) < 1000 && (
                                    <p className="text-xs text-success mt-1">✓ Sesuai</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transaction Summary */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Ringkasan Transaksi
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Pemasukan</p>
                                <p className="text-xl font-bold text-success">
                                    {formatCurrency(submission.reportData.summary.totalPemasukanRp)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                                <p className="text-xl font-bold text-danger">
                                    {formatCurrency(submission.reportData.summary.totalPengeluaranRp)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Jumlah Transaksi</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {submission.reportData.data.length} transaksi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Detail Table */}
                    <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Detail Transaksi
                            </h2>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pemasukan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pengeluaran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {submission.reportData.data.map((row) => (
                                        <tr key={row.no} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{row.no}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(row.date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                {row.name.replace('Reversal Payment', 'Pembatalan Pembayaran').replace('Payment Loan', 'Pembayaran Gadai')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-success">
                                                {row.pemasukanRp > 0 ? formatCurrency(row.pemasukanRp) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-danger">
                                                {row.pengeluaranRp > 0 ? formatCurrency(row.pengeluaranRp) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                            {submission.reportData.data.map((row) => (
                                <div key={row.no} className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {row.name.replace('Reversal Payment', 'Pembatalan Pembayaran').replace('Payment Loan', 'Pembayaran Gadai')}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(row.date)}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">#{row.no}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Pemasukan</p>
                                            <p className="text-sm font-semibold text-success">
                                                {row.pemasukanRp > 0 ? formatCurrency(row.pemasukanRp) : '-'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Pengeluaran</p>
                                            <p className="text-sm font-semibold text-danger">
                                                {row.pengeluaranRp > 0 ? formatCurrency(row.pengeluaranRp) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Review Section (if reviewed) */}
                    {submission.reviewedBy && (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Review Manager
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Direview oleh</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {submission.reviewer?.fullName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal Review</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {formatDate(submission.reviewedAt!)}
                                    </p>
                                </div>
                                {submission.reviewNote && (
                                    <div>
                                        <p className="text-sm text-gray-500">Catatan Review</p>
                                        <p className="text-gray-900 dark:text-gray-100 mt-1">{submission.reviewNote}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Review Actions (MANAJER only, if pending) */}
                    {submission.status === 'PENDING' && user?.role === 'MANAJER' && (
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={() => {
                                    setReviewStatus('REJECTED');
                                    setShowReviewModal(true);
                                }}
                                variant="ghost"
                                className="flex items-center gap-2 border-danger text-danger hover:bg-danger/10"
                            >
                                <FiXCircle className="w-5 h-5" />
                                Tolak
                            </Button>
                            <Button
                                onClick={() => {
                                    setReviewStatus('APPROVED');
                                    setShowReviewModal(true);
                                }}
                                className="flex items-center gap-2 bg-success hover:bg-success/90"
                            >
                                <FiCheckCircle className="w-5 h-5" />
                                Setujui
                            </Button>
                        </div>
                    )}

                    {/* Review Modal */}
                    {showReviewModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-xl max-w-md w-full p-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                                    {reviewStatus === 'APPROVED' ? 'Setujui Laporan' : 'Tolak Laporan'}
                                </h2>

                                <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {reviewStatus === 'APPROVED'
                                            ? 'Apakah Anda yakin ingin menyetujui laporan ini?'
                                            : 'Apakah Anda yakin ingin menolak laporan ini? Berikan alasan penolakan.'}
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Catatan {reviewStatus === 'REJECTED' ? '(Wajib)' : '(Opsional)'}
                                        </label>
                                        <textarea
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100"
                                            placeholder="Tambahkan catatan review..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={() => setShowReviewModal(false)}
                                        variant="ghost"
                                        className="flex-1"
                                        disabled={reviewing}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        onClick={submitReview}
                                        className={`flex-1 ${reviewStatus === 'APPROVED'
                                            ? 'bg-success hover:bg-success/90'
                                            : 'bg-danger hover:bg-danger/90'
                                            }`}
                                        disabled={reviewing || (reviewStatus === 'REJECTED' && !reviewNote)}
                                    >
                                        {reviewing ? 'Processing...' : 'Confirm'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
