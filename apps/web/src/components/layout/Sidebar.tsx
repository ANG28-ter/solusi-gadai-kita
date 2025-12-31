"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    FiHome,
    FiUsers,
    FiDollarSign,
    FiFileText,
    FiShoppingCart,
    FiTrendingUp,
    FiCreditCard,
    FiSettings,
    FiUser,
    FiPackage,
    FiX,
    FiChevronDown,
    FiChevronUp,
    FiLock
} from 'react-icons/fi';
import { useAuth } from '@/lib/auth-context';
import { RoleName } from '@/lib/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    allowedRoles?: RoleName[];
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <FiHome className="w-5 h-5" />,
    },
    {
        label: 'Nasabah',
        href: '/customers',
        icon: <FiUsers className="w-5 h-5" />,
    },
    {
        label: 'Barang Jaminan',
        href: '/collaterals',
        icon: <FiPackage className="w-5 h-5" />,
    },
    {
        label: 'Gadai',
        href: '/loans',
        icon: <FiDollarSign className="w-5 h-5" />,
    },
    {
        label: 'Kontrak',
        href: '/contracts',
        icon: <FiFileText className="w-5 h-5" />,
    },
    {
        label: 'Lelang',
        href: '/auctions',
        icon: <FiShoppingCart className="w-5 h-5" />,
    },
    {
        label: 'Pembayaran',
        href: '/payments',
        icon: <FiCreditCard className="w-5 h-5" />,
    },
    {
        label: 'Kas & Ledger',
        href: '/cash-ledger',
        icon: <FiTrendingUp className="w-5 h-5" />,
    },
    {
        label: 'Laporan Transaksi',
        href: '/reports/transaction',
        icon: <FiFileText className="w-5 h-5" />,
    },
    {
        label: 'Laporan Setoran',
        href: '/reports/submissions',
        icon: <FiFileText className="w-5 h-5" />,
    },
    {
        label: 'Pengaturan',
        href: '#',
        icon: <FiSettings className="w-5 h-5" />,
        children: [
            {
                label: 'Profil',
                href: '/settings',
                icon: <FiUser className="w-5 h-5" />,
            },
            {
                label: 'Pengguna',
                href: '/users',
                icon: <FiUsers className="w-5 h-5" />,
                allowedRoles: [RoleName.MANAJER],
            },
        ],
    },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [expandedGroups, setExpandedGroups] = React.useState<string[]>([]);

    // Auto-expand group if child is active
    React.useEffect(() => {
        if (!pathname) return;
        navItems.forEach(group => {
            if (group.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
                setExpandedGroups(prev => prev.includes(group.label) ? prev : [...prev, group.label]);
            }
        });
    }, [pathname]);

    function toggleGroup(label: string) {
        setExpandedGroups(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    }

    // Filter menu items based on user role
    // Helper to check role
    const hasAccess = (item: NavItem) => {
        if (!item.allowedRoles) return true;
        return user && item.allowedRoles.includes(user.role);
    };

    const filteredNavItems = navItems.filter(hasAccess).map(item => {
        // If has children, filter children too
        if (item.children) {
            return {
                ...item,
                children: item.children.filter(hasAccess)
            };
        }
        return item;
    }).filter(item => {
        // Filter out groups with no children if they were supposed to have children? 
        // Or keep them? For now, if exact item forbidden, main filter catches it.
        // If group has children but all forbidden, show group? Ideally no.
        if (item.children && item.children.length === 0) return false;
        return true;
    });

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed left-0 top-0 h-full w-64 bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-[#1e293b] flex flex-col z-50 transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-[#1e293b]">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] flex items-center justify-center text-white shadow-lg shadow-[#1e3a5f]/20">
                        <FiLock className="w-4 h-4" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        Solusi Gadai
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedGroups.includes(item.label);
                        const isActive = pathname === item.href || (!hasChildren && pathname?.startsWith(item.href + '/'));

                        // Parent Item content
                        const ItemContent = (
                            <div className={clsx(
                                'flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-colors duration-150 cursor-pointer',
                                isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                            )}>
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {hasChildren && (
                                    isExpanded ? <FiChevronUp /> : <FiChevronDown />
                                )}
                            </div>
                        );

                        return (
                            <div key={item.label}>
                                {hasChildren ? (
                                    <div onClick={() => toggleGroup(item.label)}>
                                        {ItemContent}
                                    </div>
                                ) : (
                                    <Link href={item.href} onClick={onClose}>
                                        {ItemContent}
                                    </Link>
                                )}

                                {/* Submenu */}
                                {hasChildren && isExpanded && (
                                    <div className="pl-4 mt-1 space-y-1">
                                        {item.children!.map(child => {
                                            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={onClose}
                                                    className={clsx(
                                                        'flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-colors duration-150',
                                                        isChildActive
                                                            ? 'bg-blue-50 text-primary dark:bg-[#1e293b] dark:text-blue-200'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1e293b]'
                                                    )}
                                                >
                                                    {child.icon ? child.icon : <span className="w-5" />}
                                                    <span>{child.label}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Theme Toggle */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-[#1e293b]">
                    <ThemeToggle />
                </div>

                {/* User Info */}
                {user && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-[#1e293b]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {user?.fullName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.role || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
