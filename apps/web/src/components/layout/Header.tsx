"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiMenu, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/lib/auth-context';
import { BranchSelector } from './BranchSelector';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, selectedBranchId, setSelectedBranch } = useAuth();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    function handleLogout() {
        setLogoutModalOpen(true);
    }

    function confirmLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return (
        <>
            <header className="fixed z-40 top-0 right-0 left-0 lg:left-64 h-16 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between px-4 lg:px-6 shadow-sm transition-all duration-300">
                {/* Left side - Hamburger + Branch */}
                <div className="flex items-center gap-4">
                    {/* Hamburger Menu - Mobile Only */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors text-gray-600 dark:text-gray-400"
                        aria-label="Toggle menu"
                    >
                        <FiMenu className="w-6 h-6" />
                    </button>

                    {/* Branch Selector for Manager, Static display for others */}
                    {user?.role === 'MANAJER' && selectedBranchId ? (
                        <div className="hidden sm:block">
                            <BranchSelector
                                selectedBranchId={selectedBranchId}
                                onBranchChange={setSelectedBranch}
                            />
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-xs font-medium text-gray-600 dark:text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>{user?.branchName || 'Semua Cabang'}</span>
                        </div>
                    )}
                </div>

                {/* Right side - User menu */}
                <div className="relative flex items-center gap-3">
                    {/* Notifications */}
                    <NotificationDropdown />

                    <div className="h-8 w-px bg-gray-200 dark:bg-[#334155] mx-1 hidden sm:block" />

                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`flex items-center gap-3 pl-2 pr-2 sm:pr-4 py-1.5 rounded-full border transition-all duration-200 group ${showUserMenu
                            ? 'bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-[#334155]'
                            : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#1e293b] hover:border-gray-200 dark:hover:border-[#334155]'
                            }`}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] flex items-center justify-center text-white shadow-lg shadow-[#1e3a5f]/20">
                            <span className="text-sm font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">
                                {user?.fullName?.split(' ')[0]}
                            </p>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                                {user?.role}
                            </p>
                        </div>
                        <FiChevronDown
                            className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-300 hidden sm:block ${showUserMenu ? 'rotate-180 text-blue-600 dark:text-[#d4af37]' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-3 w-60 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/40 border border-gray-100 dark:border-[#334155] py-2 animate-scale-in z-50 origin-top-right overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]/30">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Akun Saya</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{user?.username}</p>
                                </div>

                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            router.push('/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#334155] hover:text-blue-600 dark:hover:text-white rounded-xl transition-colors"
                                    >
                                        <FiUser className="w-4 h-4" />
                                        Profil
                                    </button>

                                    <div className="my-1 border-t border-gray-100 dark:border-[#334155]" />

                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        Keluar Aplikasi
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <ConfirmationModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Konfirmasi Keluar"
                message="Apakah Anda yakin ingin keluar dari aplikasi?"
                confirmText="Keluar"
                variant="danger"
            />
        </>
    );
}
