"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';

import { api } from '@/lib/api';
import { Customer, Loan } from '@/lib/types';
import { formatDate, formatPhone, formatCurrency } from '@/lib/utils';
import { FiEdit, FiArrowLeft, FiTrash2, FiPlus } from 'react-icons/fi';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoanStatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomerData();
    }, [params.id]);

    async function loadCustomerData() {
        try {
            setLoading(true);

            // Load customer data
            const customerRes = await api.get(`/customers/${params.id}`);
            setCustomer(customerRes.data);

            // Load customer's loans - try different query approaches
            try {
                // Try query parameter first
                const loansRes = await api.get(`/loans`, {
                    params: { customerId: params.id }
                });

                // Handle response - could be array or object with data property
                let loansData: Loan[] = Array.isArray(loansRes.data)
                    ? loansRes.data
                    : (loansRes.data?.data || []);

                // Filter client-side to ensure only this customer's loans
                loansData = loansData.filter(loan => loan.customerId === params.id);

                setLoans(loansData);
            } catch (loanError) {
                console.error('Error loading loans:', loanError);
                setLoans([]);
            }
        } catch (error: any) {
            toast.error('Gagal memuat data nasabah', error.message);
            router.push('/customers');
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        setIsDeleting(true);
        try {
            await api.delete(`/customers/${customer?.id}`);
            toast.success('Nasabah berhasil dihapus');
            router.push('/customers');
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            toast.error('Gagal menghapus nasabah', error.response?.data?.message || error.message);
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    }

    function handleDelete() {
        setDeleteModalOpen(true);
    }

    if (loading) {
        return (
            <AppLayout>
                <PageLoader message="Memuat data nasabah..." />
            </AppLayout>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/customers">
                            <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {customer.fullName}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono text-sm">
                                {customer.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/customers/${customer.id}/edit`}>
                            <Button variant="secondary" leftIcon={<FiEdit />}>
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="danger"
                            leftIcon={<FiTrash2 />}
                            onClick={handleDelete}
                        >
                            Hapus
                        </Button>
                    </div>
                </div>

                {/* Customer Info Card */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Informasi Nasabah</h2>
                    </CardHeader>
                    <CardBody>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Nama Lengkap
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {customer.fullName}
                                </dd>
                            </div>

                            {customer.nik && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        NIK
                                    </dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100 font-mono">
                                        {customer.nik}
                                    </dd>
                                </div>
                            )}

                            {customer.phone && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        No. Telepon
                                    </dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {formatPhone(customer.phone)}
                                    </dd>
                                </div>
                            )}

                            {customer.address && (
                                <div className="md:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Alamat
                                    </dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {customer.address}
                                    </dd>
                                </div>
                            )}

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Terdaftar Sejak
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(customer.createdAt)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Terakhir Diupdate
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(customer.updatedAt)}
                                </dd>
                            </div>
                        </dl>
                    </CardBody>
                </Card>

                {/* Loan History Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Riwayat Gadai</h2>
                            <Link href={`/loans/create?customerId=${customer.id}`}>
                                <Button size="sm" leftIcon={<FiPlus />}>
                                    Buat Gadai Baru
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loans.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                Belum ada riwayat gadai
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {loans.map((loan) => (
                                    <Link
                                        key={loan.id}
                                        href={`/loans/${loan.id}`}
                                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-medium">
                                                        {loan.code}
                                                    </span>
                                                    <LoanStatusBadge status={loan.status} />
                                                </div>
                                                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            Pokok:
                                                        </span>{' '}
                                                        <span className="font-medium">
                                                            {formatCurrency(loan.principalRp)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            Tanggal:
                                                        </span>{' '}
                                                        {formatDate(loan.startDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Nasabah"
                message={`Apakah Anda yakin ingin menghapus nasabah "${customer.fullName}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                variant="danger"
                loading={isDeleting}
            />
        </AppLayout>
    );
}
