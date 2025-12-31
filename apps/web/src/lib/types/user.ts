export type UserRole = 'ADMIN' | 'KASIR' | 'MANAJER';

export interface User {
    id: string;
    username: string;
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastActiveAt?: string;
    role: {
        name: UserRole;
    };
    branch: {
        name: string;
    };
}

export interface CreateUserPayload {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    branchId: string;
}

export interface UpdateUserPayload {
    fullName: string;
    phone?: string;
    isActive?: boolean;
}
