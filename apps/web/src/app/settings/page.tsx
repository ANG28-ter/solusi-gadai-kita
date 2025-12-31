"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FiSettings, FiUser, FiBriefcase, FiMap } from 'react-icons/fi';
import { useAuth } from '@/lib/auth-context';
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm';
import { BranchManagement } from '@/components/settings/BranchManagement';

import { RoleName } from '@/lib/types';

export default function SettingsPage() {
    const { user, hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'branch'>('profile');

    // "Profil perusahaan ... hanya bisa diedit oleh manager"
    const isManager = hasRole([RoleName.MANAJER]);

    // "Admin dan kasir hanya profil perusahaan dan profil user saja" (Implies Admin cannot see Branch)
    // Checks if user is Manager for Branch tab visibility
    const canManageBranches = hasRole([RoleName.MANAJER]);


    const tabs = [
        { id: 'profile', label: 'Profil Saya', icon: <FiUser /> },
        { id: 'company', label: 'Perusahaan', icon: <FiBriefcase /> }, // Visible to ALL
        ...(canManageBranches ? [
            { id: 'branch', label: 'Manajemen Cabang', icon: <FiMap /> }
        ] : []),

    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FiSettings className="w-6 h-6" />
                        Pengaturan
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Pengaturan akun dan preferensi aplikasi.
                    </p>
                </div>

                {/* Tabs */}
                {/* Tabs */}
                <div className="w-full overflow-x-auto pb-1 mb-6">
                    <div className="flex gap-1 sm:gap-2 border-b border-gray-200 dark:border-gray-800 w-max sm:w-full min-w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-t-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-white dark:bg-[#1A1F2E] text-primary border-b-2 border-primary'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 max-w-2xl animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                                <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl sm:text-2xl font-bold flex-shrink-0">
                                    <FiUser />
                                </div>
                                <div className="space-y-1 w-full min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words whitespace-normal leading-tight">
                                        {user?.fullName || 'User'}
                                    </h2>
                                    <p className="text-gray-500 font-medium text-sm sm:text-base">@{user?.username}</p>
                                    <div className="pt-4 sm:pt-2 flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-600 dark:text-gray-400 justify-center sm:justify-start border-t border-gray-100 dark:border-gray-800 sm:border-0 mt-4 sm:mt-0">
                                        <p className="flex items-center gap-2 justify-center sm:justify-start">
                                            <span className="font-semibold uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                                                {user?.role}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2 justify-center sm:justify-start">
                                            <span className="opacity-70">Cabang:</span>
                                            <span className="font-semibold">{user?.branchName || '-'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'company' && (
                        <div className="animate-fade-in">
                            <CompanyProfileForm readOnly={!isManager} />
                        </div>
                    )}

                    {activeTab === 'branch' && canManageBranches && (
                        <div className="animate-fade-in">
                            <BranchManagement />
                        </div>
                    )}


                </div>
            </div>
        </AppLayout>
    );
}
