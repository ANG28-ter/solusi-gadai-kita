import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export function NotificationDropdown() {
    const { user } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchNotifications() {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }

    async function markAsRead(id: string) {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    }

    async function markAllAsRead() {
        try {
            setLoading(true);
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setLoading(false);
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <FiCheckCircle className="w-5 h-5 text-green-500" />;
            case 'WARNING': return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'ERROR': return <FiX className="w-5 h-5 text-red-500" />;
            default: return <FiInfo className="w-5 h-5 text-blue-500" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white relative group outline-none"
            >
                <FiBell className={clsx("w-5 h-5 transition-transform", isOpen && "scale-110 text-primary")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#0f172a] animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-[-60px] sm:right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/40 border border-gray-100 dark:border-[#334155] py-2 animate-scale-in z-50 origin-top-right overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#334155] flex items-center justify-between bg-gray-50/50 dark:bg-[#0f172a]/30">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <FiCheck className="w-3 h-3" />
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[100px] max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#334155] flex items-center justify-center mb-3">
                                    <FiBell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada notifikasi baru</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-[#334155]">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={clsx(
                                            "px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#334155]/50 transition-colors flex gap-3 relative group",
                                            !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10",
                                            notification.link ? "cursor-pointer" : "cursor-default"
                                        )}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx("text-sm font-medium mb-0.5", !notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-300")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: id })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
