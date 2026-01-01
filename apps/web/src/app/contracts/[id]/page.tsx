"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiPrinter, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';

type Payment = {
    id: string;
    amount: number;
    createdAt: string;
};

type ContractDetail = {
    id: string;
    contractNo: string;
    status: 'FINAL' | 'VOID';
    snapshotJson: {
        templateVersion: number;
        company: {
            brand: string;
            legalName: string;
            ahu: string;
            addressLine: string;
            phone: string;
        };
        meta: {
            contractCode: string | null;
            branchCode: string;
            transactionAt: string;
            effectiveAt: string;
            dueAt: string;
            cashierName: string;
        };
        customer: {
            nik: string;
            fullName: string;
            address: string | null;
            phone: string | null;
        };
        items: Array<{
            no: number;
            name: string;
            description: string | null;
            estimatedValueRp: number | null;
        }>;
        financial: {
            estimatedValueRp: number;
            principalRp: number;
            adminFeeRp: number;
            netDisbursedRp: number;
            tenorDays: number;
        };
        clauses: Array<{ no: number; text: string }>;
    };
    finalizedAt: string | null;
    voidedAt: string | null;
    voidReason: string | null;
    loan: {
        id: string;
        code: string;
        status: string;
        payments: Payment[];
    };
};

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [contract, setContract] = useState<ContractDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [voidModalOpen, setVoidModalOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);

    useEffect(() => {
        loadContract();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    async function loadContract() {
        try {
            setLoading(true);
            const response = await api.get<ContractDetail>(`/contracts/${params.id}`);
            setContract(response.data);
        } catch (error: any) {
            console.error('Error loading contract:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat kontrak');
            router.push('/contracts');
        } finally {
            setLoading(false);
        }
    }

    async function handleVoid() {
        if (!voidReason || voidReason.trim().length < 5) {
            toast.error('Alasan pembatalan minimal 5 karakter');
            return;
        }

        setIsVoiding(true);
        try {
            await api.post(`/contracts/${params.id}/void`, { reason: voidReason });
            toast.success('Kontrak berhasil dibatalkan');
            setVoidModalOpen(false);
            setVoidReason('');
            loadContract();
        } catch (error: any) {
            console.error('Error voiding contract:', error);
            toast.error(error.response?.data?.message || 'Gagal membatalkan kontrak');
        } finally {
            setIsVoiding(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat kontrak..." />
            </AppLayout>
        );
    }

    if (!contract) {
        return (
            <AppLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Kontrak tidak ditemukan</p>
                </div>
            </AppLayout>
        );
    }

    const data = contract.snapshotJson;
    const canVoid = contract.status === 'FINAL' && (contract.loan.payments?.length ?? 0) === 0;

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                        background: white !important;
                    }
                    /* Hide ONLY header, nav, sidebar - NOT the contract */
                    header {
                        display: none !important;
                    }
                    nav {
                        display: none !important;
                    }
                    aside {
                        display: none !important;
                    }
                    /* Hide print:hidden elements */
                    .print\\:hidden {
                        display: none !important;
                    }
                    /* Remove main padding for print */
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    /* Readable font sizes for A4 print */
                    .contract-document {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        font-size: 10pt !important;
                    }
                    /* Readable heading sizes */
                    .contract-document h1 {
                        font-size: 16pt !important;
                        margin-bottom: 0.15cm !important;
                        line-height: 1.2 !important;
                    }
                    .contract-document h2 {
                        font-size: 12pt !important;
                        margin-top: 0.1cm !important;
                        margin-bottom: 0.1cm !important;
                        line-height: 1.2 !important;
                    }
                    .contract-document h3 {
                        font-size: 10pt !important;
                        margin-bottom: 0.15cm !important;
                        margin-top: 0.2cm !important;
                        line-height: 1.2 !important;
                    }
                    /* Readable body text */
                    .contract-document p,
                    .contract-document div {
                        font-size: 9pt !important;
                        line-height: 1.3 !important;
                    }
                    .contract-document table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 9pt !important;
                        margin-bottom: 0.2cm !important;
                        margin-top: 0.15cm !important;
                    }
                    .contract-document td, .contract-document th {
                        padding: 0.1cm !important;
                        border: 1px solid #333 !important;
                    }
                    .contract-document p {
                        font-size: 9pt !important;
                        line-height: 1.4 !important;
                        margin-bottom: 0.1cm !important;
                    }
                    /* Force white background and dark text for ALL elements in print - override dark mode */
                    * {
                        background-color: white !important;
                        color: black !important;
                        border-color: #333 !important;
                    }
                    /* Keep table borders visible */
                    table, td, th {
                        border-color: #333 !important;
                    }
                    .contract-document th,
                    .contract-document td {
                        padding: 0.15cm !important;
                        font-size: 9pt !important;
                        line-height: 1.25 !important;
                    }
                    /* Readable clause text */
                    .contract-document ol,
                    .contract-document li {
                        font-size: 8.5pt !important;
                        line-height: 1.35 !important;
                        margin-bottom: 0.08cm !important;
                    }
                    /* Moderate section spacing */
                    .contract-document .mb-6 {
                        margin-bottom: 0.25cm !important;
                    }
                    .contract-document .mb-4 {
                        margin-bottom: 0.2cm !important;
                    }
                    .contract-document .mb-3 {
                        margin-bottom: 0.15cm !important;
                    }
                    /* Header spacing */
                    .contract-document .border-b-2 {
                        padding-bottom: 0.2cm !important;
                        margin-bottom: 0.25cm !important;
                    }
                    /* Grid spacing */
                    .contract-document .grid {
                        gap: 0.15cm !important;
                    }
                    /* Prevent page breaks */
                    .contract-document table {
                        page-break-inside: avoid;
                    }
                    /* Signature spacing */
                    .contract-document .grid-cols-2 {
                        margin-top: 0.3cm !important;
                    }
                }
            `}</style>
            <AppLayout>
                <div className="space-y-4">
                    {/* Action Buttons (Hidden in Print) */}
                    <div className="print:hidden flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/contracts')}
                            leftIcon={<FiArrowLeft />}
                        >
                            Kembali
                        </Button>
                        <div className="flex gap-2">
                            {canVoid && (
                                <Button
                                    variant="danger"
                                    onClick={() => setVoidModalOpen(true)}
                                    leftIcon={<FiAlertTriangle />}
                                >
                                    Batalkan Kontrak
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                onClick={handlePrint}
                                leftIcon={<FiPrinter />}
                            >
                                Cetak
                            </Button>
                        </div>
                    </div>

                    {/* Status Badge (Hidden in Print) */}
                    {contract.status === 'VOID' && (
                        <div className="print:hidden bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-100">Kontrak Dibatalkan</h4>
                                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                                        Dibatalkan pada: {contract.voidedAt ? formatDate(contract.voidedAt) : '-'}
                                    </p>
                                    {contract.voidReason && (
                                        <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                                            <strong>Alasan:</strong> {contract.voidReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contract Document */}
                    <div className="contract-document bg-white shadow-lg print:shadow-none mx-auto max-w-4xl print:max-w-none p-8 print:p-0 text-gray-900">
                        {/* Header - Compact Horizontal Layout */}
                        <div className="border-b-2 border-gray-800 pb-2 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="text-left">
                                    <h1 className="text-xl font-bold uppercase text-gray-900 leading-tight">{data.company.brand}</h1>
                                    <p className="text-xs text-gray-800 mt-0.5">{data.company.legalName} • {data.company.ahu}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-sm font-bold text-gray-900 leading-tight">SURAT BUKTI GADAI</h2>
                                    <p className="text-xs font-mono text-gray-800 mt-0.5">{data.meta.contractCode || contract.contractNo}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-700 text-left mt-1">{data.company.addressLine} • Telp: {data.company.phone}</p>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-6">
                            <h3 className="font-bold mb-3 text-sm uppercase border-b border-gray-300 pb-1 text-gray-900">Data Nasabah</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm text-gray-800">
                                <div>
                                    <span className="font-semibold text-gray-900">Nama:</span>
                                </div>
                                <div className="col-span-2">{data.customer.fullName}</div>
                                <div>
                                    <span className="font-semibold text-gray-900">NIK:</span>
                                </div>
                                <div className="col-span-2">{data.customer.nik}</div>
                                <div>
                                    <span className="font-semibold text-gray-900">Alamat:</span>
                                </div>
                                <div className="col-span-2">{data.customer.address || '-'}</div>
                                <div>
                                    <span className="font-semibold text-gray-900">Telepon:</span>
                                </div>
                                <div className="col-span-2">{data.customer.phone || '-'}</div>
                            </div>
                        </div>

                        {/* Collateral Items */}
                        <div className="mb-6">
                            <h3 className="font-bold mb-3 text-sm uppercase border-b border-gray-300 pb-1 text-gray-900">Daftar Barang Jaminan</h3>
                            <table className="w-full text-sm border-collapse border border-gray-300 text-gray-800">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-2 py-1 text-center w-12 text-gray-900">No</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left text-gray-900">Nama Barang</th>
                                        <th className="border border-gray-300 px-2 py-1 text-left text-gray-900">Keterangan</th>
                                        <th className="border border-gray-300 px-2 py-1 text-right w-32 text-gray-900">Taksiran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item) => (
                                        <tr key={item.no}>
                                            <td className="border border-gray-300 px-2 py-1 text-center">{item.no}</td>
                                            <td className="border border-gray-300 px-2 py-1">{item.name}</td>
                                            <td className="border border-gray-300 px-2 py-1">{item.description || '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right">
                                                {item.estimatedValueRp ? formatCurrency(item.estimatedValueRp) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Summary */}
                        <div className="mb-6">
                            <h3 className="font-bold mb-3 text-sm uppercase border-b border-gray-300 pb-1 text-gray-900">Rincian Keuangan</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
                                <div>Total Taksiran Barang:</div>
                                <div className="text-right font-semibold">{formatCurrency(data.financial.estimatedValueRp)}</div>
                                <div>Uang Pinjaman (Pokok):</div>
                                <div className="text-right font-semibold">{formatCurrency(data.financial.principalRp)}</div>
                                <div>Biaya Admin:</div>
                                <div className="text-right">{formatCurrency(data.financial.adminFeeRp)}</div>
                                <div className="border-t border-gray-300 pt-1 font-bold text-gray-900">Uang Diterima Nasabah:</div>
                                <div className="border-t border-gray-300 pt-1 text-right font-bold text-lg text-gray-900">
                                    {formatCurrency(data.financial.netDisbursedRp)}
                                    <p className="text-xs font-thin">(belum termasuk bunga)</p>
                                </div>
                                <div className="mt-2">Tenor:</div>
                                <div className="mt-2 text-right">{data.financial.tenorDays} hari</div>
                                <div>Tanggal Efektif:</div>
                                <div className="text-right">{formatDate(data.meta.effectiveAt)}</div>
                                <div>Tanggal Jatuh Tempo:</div>
                                <div className="text-right font-semibold">{formatDate(data.meta.dueAt)}</div>
                            </div>
                        </div>


                        {/* Terms and Conditions */}
                        <div className="mb-16">
                            <h3 className="font-bold mb-3 text-sm uppercase border-b border-gray-300 pb-1 text-gray-900">Dengan ini saya menyatakan :</h3>
                            <ol className="text-xs space-y-1 list-decimal list-inside text-gray-800">
                                {data.clauses.map((clause) => {
                                    // Replace "..." with actual amount in clause 10
                                    let clauseText = clause.text;
                                    if (clause.no === 10) {
                                        clauseText = clause.text.replace('...', formatCurrency(data.financial.netDisbursedRp));
                                    }
                                    return (
                                        <li key={clause.no}>{clauseText}</li>
                                    );
                                })}
                            </ol>
                        </div>

                        {/* Signature Section */}
                        <div className="grid grid-cols-2 gap-8 mt-16 text-center">
                            <div>
                                <p className="mb-4">Nasabah,</p>
                                <div className="mt-16 mb-2">
                                    <p className="border-t border-gray-800 inline-block px-8 pt-1 text-gray-900">({data.customer.fullName})</p>
                                </div>
                            </div>
                            <div>
                                <p className="mb-4">Petugas,</p>
                                <div className="mt-16 mb-2">
                                    <p className="border-t border-gray-800 inline-block px-8 pt-1 text-gray-900">({data.meta.cashierName})</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {/* <div className="mt-8 pt-6 border-t border-gray-300 print:border-gray-400 bg-gray-50 print:bg-white rounded text-center text-xs text-gray-600 print:text-gray-800">
                            <p>Tanggal Transaksi: {formatDate(data.meta.transactionAt)}</p>
                            <p>Dokumen ini dicetak secara otomatis dan sah tanpa tanda tangan basah</p>
                        </div> */}
                    </div>
                </div>

                {/* Void Reason Modal */}
                {voidModalOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-black bg-opacity-50"
                            onClick={() => setVoidModalOpen(false)}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                        <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batalkan Kontrak</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            Tindakan ini tidak dapat dibatalkan. Masukkan alasan pembatalan:
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Alasan Pembatalan (minimal 5 karakter)
                                    </label>
                                    <textarea
                                        value={voidReason}
                                        onChange={(e) => setVoidReason(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Masukkan alasan pembatalan..."
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setVoidModalOpen(false);
                                            setVoidReason('');
                                        }}
                                        disabled={isVoiding}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleVoid}
                                        loading={isVoiding}
                                        disabled={voidReason.trim().length < 5}
                                    >
                                        Batalkan Kontrak
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </AppLayout>
        </>
    );
}
