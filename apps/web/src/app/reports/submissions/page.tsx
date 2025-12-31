"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { ReportSubmission, ReportStatus } from '@/lib/types/report-submission';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function SubmissionsListPage() {
    const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const toast = useToast();
    const router = useRouter();

    React.useEffect(() => {
        loadSubmissions();
    }, [statusFilter]);

    async function loadSubmissions() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') {
                params.append('status', statusFilter);
            }

            const response = await api.get<ReportSubmission[]>(`/reports/submissions?${params.toString()}`);
            setSubmissions(response.data);
        } catch (error: any) {
            console.error('Error loading submissions:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat data laporan');
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status: ReportStatus) {
        const variants = {
            PENDING: { variant: 'default' as const, icon: FiClock, label: 'Menunggu Review' },
            APPROVED: { variant: 'success' as const, icon: FiCheckCircle, label: 'Disetujui' },
            REJECTED: { variant: 'danger' as const, icon: FiXCircle, label: 'Ditolak' },
            REVISED: { variant: 'default' as const, icon: FiClock, label: 'Perlu Revisi' },
        };

        const config = variants[status];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} size="sm">
                <Icon className="w-3 h-3 mr-1 inline" />
                {config.label}
            </Badge>
        );
    }

    if (loading && submissions.length === 0) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data laporan..." />
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
                            Laporan Setoran
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Daftar laporan yang telah disetor
                        </p>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter Status:
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-700 dark:text-gray-100 transition-colors duration-150"
                        >
                            <option value="ALL">Semua</option>
                            <option value="PENDING">Menunggu Review</option>
                            <option value="APPROVED">Disetujui</option>
                            <option value="REJECTED">Ditolak</option>
                        </select>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
                            <FiFileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Belum ada laporan yang disetor</p>
                        </div>
                    ) : (
                        submissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:border-primary/30 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                Laporan {formatDate(submission.periodStart)} - {formatDate(submission.periodEnd)}
                                            </h3>
                                            {getStatusBadge(submission.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Disetor oleh</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {submission.submitter.fullName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Setor</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {formatDate(submission.submittedAt)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Kas Fisik</p>
                                                <p className="font-semibold text-primary">
                                                    {formatCurrency(submission.physicalCashRp)}
                                                </p>
                                            </div>
                                        </div>

                                        {submission.reviewedBy && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Direview oleh</p>
                                                        <p className="font-medium">{submission.reviewer?.fullName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Tanggal Review</p>
                                                        <p className="font-medium">{formatDate(submission.reviewedAt!)}</p>
                                                    </div>
                                                </div>
                                                {submission.reviewNote && (
                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">Catatan:</span> {submission.reviewNote}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/reports/submissions/${submission.id}`)}
                                        className="ml-4 p-2.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-colors"
                                        title="Lihat Detail"
                                    >
                                        <FiEye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
