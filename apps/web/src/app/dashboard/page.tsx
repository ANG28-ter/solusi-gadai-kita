"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { Loan, Payment, DashboardStats } from "@/lib/types";
import { LoanStatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiShoppingCart,
  FiSettings,
  FiPlus,
  FiArrowRight,
  FiUsers,
} from "react-icons/fi";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const res = await api.get("/dashboard");

      const data = res.data;
      setStats(data.stats);
      setRecentLoans(data.recentLoans || []);
      setRecentPayments(data.recentPayments || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Memuat dashboard...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Selamat datang kembali! Berikut ringkasan hari ini.
            </p>
          </div>
          <Link href="/loans/create" className="w-full sm:w-auto">
            <Button size="lg" leftIcon={<FiPlus />} fullWidth className="sm:w-auto">
              Buat Gadai Baru
            </Button>
          </Link>
        </div>

        {/* 6 Main Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Data Gadai */}
          <Link href="/loans">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Data Gadai
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {stats?.loans.active || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Aktif
                  </span>
                  <span className="font-semibold text-green-600">
                    {stats?.loans.active}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Jatuh Tempo
                  </span>
                  <span className="font-semibold text-red-600">
                    {stats?.loans.overdue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Rata-rata
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {stats?.loans.active
                      ? formatCurrency(stats.loans.totalAmount / stats.loans.active)
                      : "Rp 0"}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Pinjaman
                  </span>
                  <p className="font-bold text-lg">
                    {formatCurrency(stats?.loans.totalAmount || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* 2. Kas Masuk dan Keluar */}
          <Link href="/cash-ledger">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Kas Hari Ini
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {formatCurrency(stats?.cash.inToday || 0)}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-success rounded-2xl flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Kas Masuk
                  </span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <FiTrendingUp />
                    {formatCurrency(stats?.cash.inToday || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Kas Keluar
                  </span>
                  <span className="font-semibold text-red-600 flex items-center gap-1">
                    <FiTrendingDown />
                    {formatCurrency(stats?.cash.outToday || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Total Masuk Bulan Ini
                    </span>
                    <span className="text-xs font-semibold text-green-600">
                      {formatCurrency(stats?.cash.inThisMonth || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Total Keluar Bulan Ini
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      {formatCurrency(stats?.cash.outThisMonth || 0)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Saldo Kas
                  </span>
                  <p className="font-bold text-lg">
                    {formatCurrency(stats?.cash.balance || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* 3. Laporan Transaksi */}
          <Link href="/payments">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pembayaran Hari Ini
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {stats?.payments.countToday || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-info rounded-2xl flex items-center justify-center">
                  <FiCreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Pembayaran
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(stats?.payments.totalToday || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Pembayaran Bulan Ini
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(stats?.payments.totalThisMonth || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Bunga Terkumpul
                  </span>
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(stats?.payments.interestCollected || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* 4. Lelang */}
          <Link href="/auctions">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Lelang & Jatuh Tempo
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {stats?.auctions.listed || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-warning rounded-2xl flex items-center justify-center">
                  <FiShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Dalam Lelang
                  </span>
                  <span className="font-semibold text-orange-600">
                    {stats?.auctions.listed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Jatuh Tempo Minggu Ini
                  </span>
                  <span className="font-semibold text-red-600">
                    {stats?.auctions.dueThisWeek}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Terjual Bulan Ini
                  </span>
                  <span className="font-semibold text-green-600">
                    {stats?.auctions.soldThisMonth}
                  </span>
                </div>
              </div>
            </Card>
          </Link>

          {/* 5. Data Nasabah */}
          <Link href="/customers">
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Data Nasabah
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {stats?.customers.total || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Nasabah
                  </span>
                  <span className="font-semibold text-indigo-600">
                    {stats?.customers.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Nasabah Baru Bulan Ini
                  </span>
                  <span className="font-semibold text-green-600">
                    +{stats?.customers.newThisMonth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Aktif
                  </span>
                </div>
              </div>
            </Card>
          </Link>

          {/* 6. Pengaturan User */}
          <Card hover className="p-6 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pengaturan
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Quick Access
                </h3>
              </div>
              <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center">
                <FiSettings className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <Link
                href="/users"
                className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                Profil Pengguna
              </Link>
              <Link
                href="/settings"
                className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                Profil Kantor
              </Link>
              <Link
                href="/settings"
                className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                Cabang
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Loans */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gadai Terbaru</h2>
              <Link href="/loans">
                <Button variant="ghost" size="sm" rightIcon={<FiArrowRight />}>
                  Lihat Semua
                </Button>
              </Link>
            </div>
            <CardBody>
              <Table
                data={recentLoans}
                columns={[
                  { key: "code", header: "Kode" },
                  {
                    key: "customer",
                    header: "Nasabah",
                    render: (loan) => loan.customer?.fullName || "-",
                  },
                  {
                    key: "principalRp",
                    header: "Jumlah",
                    render: (loan) => formatCurrency(loan.principalRp),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (loan) => <LoanStatusBadge status={loan.status} />,
                  },
                ]}
                onRowClick={(loan) => (window.location.href = `/loans/${loan.id}`)}
                emptyMessage="Belum ada gadai"
              />
            </CardBody>
          </Card>

          {/* Recent Payments */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pembayaran Terbaru</h2>
              <Link href="/payments">
                <Button variant="ghost" size="sm" rightIcon={<FiArrowRight />}>
                  Lihat Semua
                </Button>
              </Link>
            </div>
            <CardBody>
              <Table
                data={recentPayments}
                columns={[
                  {
                    key: "loan",
                    header: "Kode Gadai",
                    render: (payment) => payment.loan?.code || "-",
                  },
                  {
                    key: "amountRp",
                    header: "Jumlah",
                    render: (payment) => formatCurrency(payment.amountRp),
                  },
                  {
                    key: "paidAt",
                    header: "Tanggal",
                    render: (payment) => formatDate(payment.paidAt),
                  },
                  {
                    key: "user",
                    header: "User",
                    render: (payment) => payment.user?.fullName || "-",
                  },
                ]}
                emptyMessage="Belum ada pembayaran"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
