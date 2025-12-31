"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { ReportSubmission } from '@/lib/types/report-submission';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ReportPrintPage() {
    const params = useParams();
    const router = useRouter();
    const [submission, setSubmission] = useState<ReportSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
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
            toast.error('Gagal memuat laporan');
            router.push('/reports/submissions');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !submission) {
        return <PageLoader message="Memuat laporan..." />;
    }

    const discrepancy = submission.physicalCashRp - submission.reportData.summary.saldoRp;

    return (
        <>
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                }
                
                @media screen {
                    .print-container {
                        max-width: 21cm;
                        margin: 2rem auto;
                        background: white;
                        padding: 2cm;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                }
            `}</style>

            {/* Action Buttons */}
            <div className="no-print sticky top-0 bg-gray-900 text-white p-4 flex items-center justify-between z-50">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                    ← Kembali
                </button>
                <h1 className="text-xl font-bold">Preview Laporan Setoran</h1>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                >
                    🖨️ Cetak
                </button>
            </div>

            {/* Document */}
            <div className="print-container" style={{ fontFamily: 'Arial, sans-serif', color: '#000' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                        LAPORAN SETORAN TRANSAKSI
                    </h1>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                        {submission.branch?.name || 'CABANG UTAMA'}
                    </h2>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}>
                        Periode: {formatDate(submission.periodStart)} s/d {formatDate(submission.periodEnd)}
                    </p>
                    <p style={{ fontSize: '12px', margin: '5px 0' }}>
                        Tanggal Setor: {formatDate(submission.submittedAt)}
                    </p>
                </div>

                {/* Submission Info */}
                <div style={{ marginBottom: '20px' }}>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '30%', padding: '5px 0' }}><strong>Disetor Oleh</strong></td>
                                <td style={{ padding: '5px 0' }}>: {submission.submitter.fullName} (@{submission.submitter.username})</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}><strong>Tanggal Setoran</strong></td>
                                <td style={{ padding: '5px 0' }}>: {formatDate(submission.submittedAt)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}><strong>Status</strong></td>
                                <td style={{ padding: '5px 0' }}>:
                                    <strong style={{
                                        padding: '2px 8px',
                                        border: '1px solid #000',
                                        display: 'inline-block',
                                        fontSize: '11px'
                                    }}>
                                        {submission.status === 'APPROVED' ? 'DISETUJUI' :
                                            submission.status === 'REJECTED' ? 'DITOLAK' :
                                                submission.status === 'REVISED' ? 'REVISI' : 'PENDING'}
                                    </strong>
                                </td>
                            </tr>
                            {submission.note && (
                                <tr>
                                    <td style={{ padding: '5px 0', verticalAlign: 'top' }}><strong>Catatan Kasir</strong></td>
                                    <td style={{ padding: '5px 0' }}>: {submission.note}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div style={{ marginBottom: '15px', padding: '12px', border: '2px solid #000' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>RINGKASAN KAS</h3>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', padding: '5px 0' }}>Total Pemasukan</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {formatCurrency(submission.reportData.summary.totalPemasukanRp)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}>Total Pengeluaran</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {formatCurrency(submission.reportData.summary.totalPengeluaranRp)}
                                </td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #d1d5db' }}>
                                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold' }}>Saldo Sistem</td>
                                <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                    {formatCurrency(submission.reportData.summary.saldoRp)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>Kas Fisik</td>
                                <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                                    {formatCurrency(submission.physicalCashRp)}
                                </td>
                            </tr>
                            <tr style={{ borderTop: '2px solid #000' }}>
                                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold' }}>Selisih</td>
                                <td style={{
                                    textAlign: 'right',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {discrepancy >= 0 ? '+' : ''}{formatCurrency(discrepancy)}
                                    {Math.abs(discrepancy) < 1000 && ' (Sesuai)'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Transaction Detail Table */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>DETAIL TRANSAKSI</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center', width: '5%' }}>No</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', width: '15%' }}>Tanggal</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>Keterangan</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right', width: '20%' }}>Pemasukan</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right', width: '20%' }}>Pengeluaran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submission.reportData.data.map((row, index) => (
                                <tr key={row.no}>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{row.no}</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>{formatDate(row.date)}</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>
                                        {row.name.replace('Reversal Payment', 'Pembatalan Pembayaran').replace('Payment Loan', 'Pembayaran Gadai')}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right', fontWeight: row.pemasukanRp > 0 ? 'bold' : 'normal' }}>
                                        {row.pemasukanRp > 0 ? formatCurrency(row.pemasukanRp) : '-'}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right', fontWeight: row.pengeluaranRp > 0 ? 'bold' : 'normal' }}>
                                        {row.pengeluaranRp > 0 ? formatCurrency(row.pengeluaranRp) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                                <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right' }}>TOTAL</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right' }}>
                                    {formatCurrency(submission.reportData.summary.totalPemasukanRp)}
                                </td>
                                <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right' }}>
                                    {formatCurrency(submission.reportData.summary.totalPengeluaranRp)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Review Section (if reviewed) */}
                {submission.reviewedBy && (
                    <div style={{ marginBottom: '20px', padding: '12px', border: '2px solid #000' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>REVIEW MANAGER</h3>
                        <table style={{ width: '100%', fontSize: '12px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '30%', padding: '5px 0' }}><strong>Direview Oleh</strong></td>
                                    <td style={{ padding: '5px 0' }}>: {submission.reviewer?.fullName}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '5px 0' }}><strong>Tanggal Review</strong></td>
                                    <td style={{ padding: '5px 0' }}>: {formatDate(submission.reviewedAt!)}</td>
                                </tr>
                                {submission.reviewNote && (
                                    <tr>
                                        <td style={{ padding: '5px 0', verticalAlign: 'top' }}><strong>Catatan</strong></td>
                                        <td style={{ padding: '5px 0' }}>: {submission.reviewNote}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Signatures */}
                <div style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                                    <p style={{ marginBottom: '5px' }}>Disetor Oleh,</p>
                                    <div style={{ height: '60px' }}></div>
                                    <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', display: 'inline-block', padding: '5px 30px 0 30px' }}>
                                        {submission.submitter.fullName}
                                    </p>
                                </td>
                                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                                    <p style={{ marginBottom: '5px' }}>Diterima Oleh,</p>
                                    <div style={{ height: '60px' }}></div>
                                    <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', display: 'inline-block', padding: '5px 30px 0 30px' }}>
                                        {submission.reviewer?.fullName || '(................................)'}
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '20px', paddingTop: '10px', textAlign: 'center', fontSize: '10px' }}>
                    <p>SOLUSI GADAI KITA - {new Date().toLocaleString('id-ID')}</p>
                </div>
            </div>
        </>
    );
}
