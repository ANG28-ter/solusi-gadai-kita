/**
 * Branch Filter Utility
 * Provides consistent branch filtering logic across all services
 */

export interface BranchFilterUser {
    role: string;
    branchId: string;
}

/**
 * Get branch filter for queries
 * - KASIR: always their branch only
 * - MANAJER/ADMIN: selected branch (from header/param)
 */
export function getBranchFilter(
    user: BranchFilterUser,
    selectedBranchId?: string,
): { branchId: string } {
    const isManager = user.role === 'MANAJER' || user.role === 'ADMIN';

    // Manager with explicit selection
    if (isManager && selectedBranchId) {
        return { branchId: selectedBranchId };
    }

    // Kasir or Manager without selection = their home branch
    return { branchId: user.branchId };
}

/**
 * Extract selected branch from request headers
 */
export function extractSelectedBranch(headers: any): string | undefined {
    return headers['x-selected-branch'] || headers['X-Selected-Branch'];
}
