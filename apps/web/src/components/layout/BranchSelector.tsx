'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FiRefreshCw } from 'react-icons/fi';

interface Branch {
    id: string;
    name: string;
}

interface BranchSelectorProps {
    selectedBranchId: string;
    onBranchChange: (branchId: string) => void;
}

export function BranchSelector({ selectedBranchId, onBranchChange }: BranchSelectorProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingBranchId, setPendingBranchId] = useState(selectedBranchId);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        setPendingBranchId(selectedBranchId);
    }, [selectedBranchId]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/system/branches');
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (pendingBranchId !== selectedBranchId) {
            setIsRefreshing(true);
            onBranchChange(pendingBranchId);
            // Refresh page after a short delay to ensure localStorage is updated
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading...</div>;
    }

    const hasChanges = pendingBranchId !== selectedBranchId;

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="branch-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cabang:
            </label>
            <select
                id="branch-selector"
                value={pendingBranchId}
                onChange={(e) => setPendingBranchId(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-primary focus:border-transparent
                   transition-colors"
            >
                {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                ))}
            </select>

            <button
                onClick={handleConfirm}
                disabled={!hasChanges || isRefreshing}
                className={`p-2 rounded-lg transition-all ${hasChanges && !isRefreshing
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                title="Terapkan & Refresh"
            >
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}
