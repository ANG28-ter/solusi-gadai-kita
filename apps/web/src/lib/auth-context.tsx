"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { AuthUser, LoginResponse, RoleName } from './types';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    selectedBranchId: string | null;
    setSelectedBranch: (branchId: string) => void;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: RoleName[]) => boolean;
    updateUserContext: (updatedData: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedBranch = localStorage.getItem('selectedBranchId');

        if (token && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser) as AuthUser;
                setUser(parsedUser);
                // Initialize with saved branch or user's home branch
                setSelectedBranchIdState(savedBranch || parsedUser.branchId);
            } catch (error) {
                console.error('Failed to parse saved user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', {
                username,
                password,
            });

            const { access_token, user: userData } = response.data;

            // Store token
            localStorage.setItem('token', access_token);

            // Create auth user object
            const authUser: AuthUser = {
                id: userData.id,
                username: userData.username,
                fullName: userData.fullName,
                phone: userData.phone || undefined,
                role: (typeof userData.role === 'string' ? userData.role : userData.role?.name) as RoleName || RoleName.KASIR,
                branchId: userData.branchId,
                branchName: userData.branch?.name,
            };

            // Store user data
            localStorage.setItem('user', JSON.stringify(authUser));
            setUser(authUser);

            // Initialize branch selection with user's home branch
            setSelectedBranchIdState(authUser.branchId);
            localStorage.setItem('selectedBranchId', authUser.branchId);

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.message || 'Login gagal');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedBranchId');
        setUser(null);
        setSelectedBranchIdState(null);
        router.push('/login');
    };

    const setSelectedBranch = (branchId: string) => {
        setSelectedBranchIdState(branchId);
        localStorage.setItem('selectedBranchId', branchId);
    };

    const hasRole = (roles: RoleName[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    // Removed duplicate hasRole


    const updateUserContext = (updatedData: Partial<AuthUser>) => {
        if (!user) return;

        const newUser: AuthUser = {
            ...user,
            ...updatedData
        };

        // Update state
        setUser(newUser);

        // Update local storage
        localStorage.setItem('user', JSON.stringify(newUser));

        // No need to update token, existing token remains valid until expiration
        // The payload in token will be stale but we prioritize AuthContext state for UI
    };

    const value: AuthContextType = {
        user,
        loading,
        selectedBranchId,
        setSelectedBranch,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        updateUserContext,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles?: RoleName[]
) {
    return function ProtectedRoute(props: P) {
        const { user, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !user) {
                router.replace('/login');
            } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
                router.replace('/dashboard'); // Redirect to dashboard if role not allowed
            }
        }, [user, loading, router]);

        if (loading) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-lg">Loading...</div>
                </div>
            );
        }

        if (!user) {
            return null;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return null;
        }

        return <Component {...props} />;
    };
}
