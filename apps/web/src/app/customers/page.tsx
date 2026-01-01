"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';
import { api } from '@/lib/api';
import { Customer } from '@/lib/types';
import { formatDate, formatPhone } from '@/lib/utils';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Changed to useState
  const toast = useToast();
  const router = useRouter();

  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, debouncedQuery, itemsPerPage]); // Added itemsPerPage to dependency array

  async function loadCustomers() {
    try {
      setLoading(true);
      const response = await api.get('/customers');

      // Handle response - could be array or object with data property
      let data: Customer[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      // Client-side filtering
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        data = data.filter(
          (c) =>
            c.fullName.toLowerCase().includes(query) ||
            c.nik?.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query)
        );
      }

      // Client-side pagination
      const totalItems = data.length;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setCustomers(paginatedData);
      setTotalPages(Math.ceil(totalItems / itemsPerPage));
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Gagal memuat data nasabah', error.response?.data?.message || error.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    const { id } = deleteModalState;
    if (!id) return;

    setIsDeleting(true);
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Nasabah berhasil dihapus');
      setDeleteModalState({ isOpen: false, id: '', name: '' });
      loadCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error('Gagal menghapus nasabah', error.response?.data?.message || error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  function openDeleteModal(id: string, name: string) {
    setDeleteModalState({ isOpen: true, id, name });
  }

  if (loading && customers.length === 0) {
    return (
      <AppLayout>
        <PageLoader message="Memuat data nasabah..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Nasabah
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola data nasabah pegadaian
            </p>
          </div>
          <Link href="/customers/create" className="w-full sm:w-auto">
            <Button leftIcon={<FiPlus />} fullWidth className="sm:w-auto">
              Tambah Nasabah
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari nama, NIK, atau kode nasabah..."
              leftIcon={<FiSearch />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              fullWidth
            />
          </div>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
          <Table
            data={customers}
            columns={[
              {
                key: 'code',
                header: 'Kode',
                render: (customer) => (
                  <span className="font-mono text-sm">{customer.code}</span>
                ),
              },
              {
                key: 'fullName',
                header: 'Nama Lengkap',
                render: (customer) => (
                  <div>
                    <p className="font-medium">{customer.fullName}</p>
                    {customer.nik && (
                      <p className="text-xs text-gray-500">NIK: {customer.nik}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'No. Telepon',
                render: (customer) =>
                  customer.phone ? formatPhone(customer.phone) : '-',
              },
              {
                key: 'address',
                header: 'Alamat',
                render: (customer) => (
                  <span className="truncate max-w-xs block">
                    {customer.address || '-'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                header: 'Terdaftar',
                render: (customer) => formatDate(customer.createdAt),
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (customer) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors duration-150"
                      title="Lihat Detail"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/customers/${customer.id}/edit`)}
                      className="p-1.5 text-success hover:bg-success/10 dark:hover:bg-success/20 rounded-lg transition-colors duration-150"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(customer.id, customer.fullName)}
                      className="p-1.5 text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-lg transition-colors duration-150"
                      title="Hapus"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            emptyMessage="Tidak ada data nasabah"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={customers.length * totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Mobile Card View - Hidden on Desktop */}
        <div className="md:hidden space-y-4">
          {customers.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Tidak ada data nasabah</p>
            </div>
          ) : (
            <>
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white dark:bg-[#1A1F2E] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {customer.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                        {customer.code}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {customer.nik && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">NIK:</span>
                        <span className="font-mono">{customer.nik}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Telepon:</span>
                        <span>{formatPhone(customer.phone)}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Alamat:</span>
                        <span className="flex-1">{customer.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 w-20">Terdaftar:</span>
                      <span>{formatDate(customer.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-colors duration-150"
                    >
                      <FiEye className="w-4 h-4" />
                      Detail
                    </button>
                    <button
                      onClick={() => router.push(`/customers/${customer.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-success hover:bg-success/10 dark:hover:bg-success/20 rounded-xl transition-colors duration-150"
                    >
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(customer.id, customer.fullName)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-xl transition-colors duration-150"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={customers.length * totalPages}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Nasabah"
        message={`Apakah Anda yakin ingin menghapus nasabah "${deleteModalState.name}"?`}
        confirmText="Hapus"
        variant="danger"
        loading={isDeleting}
      />
    </AppLayout>
  );
}
