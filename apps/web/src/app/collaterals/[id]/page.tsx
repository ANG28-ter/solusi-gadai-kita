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
import { CollateralItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCollateralStatus, getCollateralStatusVariant } from '@/lib/collateral-utils';
import { FiArrowLeft, FiEdit, FiTrash2, FiPackage, FiDollarSign } from 'react-icons/fi';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import Link from 'next/link';
import { CollateralPhotos } from '@/components/collaterals/CollateralPhotos';

export default function CollateralDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [collateral, setCollateral] = useState<CollateralItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadCollateralData();
    }, [params.id]);

    async function loadCollateralData() {
        try {
            setLoading(true);

            // Get specific collateral by ID
            const response = await api.get(`/collaterals/${params.id}`);
            const collateralData = response.data;

            if (!collateralData) {
                throw new Error('Collateral not found');
            }

            setCollateral(collateralData);
        } catch (error: any) {
            console.error('Error loading collateral:', error);
            toast.error('Gagal memuat data barang jaminan', error.response?.data?.message || error.message);
            router.push('/collaterals');
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        if (!collateral) return;
        setIsDeleting(true);
        try {
            await api.delete(`/collaterals/${collateral.id}`);
            toast.success('Barang jaminan berhasil dihapus');
            router.push('/collaterals');
        } catch (error: any) {
            console.error('Error deleting collateral:', error);
            toast.error('Gagal menghapus barang jaminan', error.response?.data?.message || error.message);
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
                <PageLoader message="Memuat data barang jaminan..." />
            </AppLayout>
        );
    }

    if (!collateral) {
        return null;
    }

    const status = getCollateralStatus(collateral);
    const variant = getCollateralStatusVariant(status);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/collaterals">
                            <Button variant="ghost" leftIcon={<FiArrowLeft />}>
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {collateral.name}
                                </h1>
                                <Badge variant={variant} size="sm">
                                    {status}
                                </Badge>
                            </div>
                            {collateral.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {collateral.description}
                                </p>
                            )}
                        </div>
                    </div>
                    {!collateral.loanId && (
                        <div className="flex items-center gap-2">
                            <Link href={`/collaterals/${collateral.id}/edit`}>
                                <Button variant="secondary" leftIcon={<FiEdit />}>
                                    Edit
                                </Button>
                            </Link>
                            <Button variant="danger" leftIcon={<FiTrash2 />} onClick={handleDelete}>
                                Hapus
                            </Button>
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <FiDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimasi Nilai</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {collateral.estimatedValueRp ? formatCurrency(collateral.estimatedValueRp) : '-'}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <FiPackage className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Status Jaminan</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {status}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Collateral Info */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Informasi Barang Jaminan</h2>
                    </CardHeader>
                    <CardBody>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Nama Barang
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {collateral.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Estimasi Nilai
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {collateral.estimatedValueRp ? formatCurrency(collateral.estimatedValueRp) : '-'}
                                </dd>
                            </div>

                            {collateral.description && (
                                <div className="md:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Deskripsi
                                    </dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {collateral.description}
                                    </dd>
                                </div>
                            )}

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tanggal Dibuat
                                </dt>
                                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                    {formatDate(collateral.createdAt)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                </dt>
                                <dd className="mt-1">
                                    <Badge variant={variant}>
                                        {status}
                                    </Badge>
                                </dd>
                            </div>
                        </dl>
                    </CardBody>
                </Card>

                {/* Collateral Photos */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Foto Barang Jaminan</h2>
                    </CardHeader>
                    <CardBody>
                        <CollateralPhotos
                            collateralId={collateral.id}
                            photoUrls={collateral.photoUrls || []}
                            onUpdate={loadCollateralData}
                            editable={true}
                        />
                    </CardBody>
                </Card>

                {/* Loan Info (if attached to loan) */}
                {collateral.loan && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Informasi Gadai Terkait</h2>
                        </CardHeader>
                        <CardBody>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Kode Gadai
                                    </dt>
                                    <dd className="mt-1">
                                        <Link
                                            href={`/loans/${collateral.loan.id}`}
                                            className="text-blue-600 hover:underline font-mono"
                                        >
                                            {collateral.loan.code}
                                        </Link>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Nasabah
                                    </dt>
                                    <dd className="mt-1">
                                        {collateral.loan.customer ? (
                                            <Link
                                                href={`/customers/${collateral.loan.customer.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {collateral.loan.customer.fullName}
                                            </Link>
                                        ) : '-'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Status Gadai
                                    </dt>
                                    <dd className="mt-1">
                                        <Badge variant={collateral.loan.status === 'ACTIVE' ? 'success' : 'default'}>
                                            {collateral.loan.status}
                                        </Badge>
                                    </dd>
                                </div>

                                {collateral.loan.auction && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Status Lelang
                                        </dt>
                                        <dd className="mt-1">
                                            <Badge variant={collateral.loan.auction.status === 'SOLD' ? 'default' : 'info'}>
                                                {collateral.loan.auction.status}
                                            </Badge>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </CardBody>
                    </Card>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Barang Jaminan"
                message={`Apakah Anda yakin ingin menghapus "${collateral.name}"?`}
                confirmText="Hapus"
                variant="danger"
                loading={isDeleting}
            />
        </AppLayout>
    );
}
