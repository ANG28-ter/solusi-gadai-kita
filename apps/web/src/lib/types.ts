// Enums matching backend Prisma schema
export enum RoleName {
    ADMIN = 'ADMIN',
    KASIR = 'KASIR',
    MANAJER = 'MANAJER',
}

export enum LoanStatus {
    ACTIVE = 'ACTIVE',
    OVERDUE = 'OVERDUE',
    LUNAS = 'LUNAS',
    CLOSED = 'CLOSED',
}

export enum CashType {
    IN = 'IN',
    OUT = 'OUT',
}

export enum CashSource {
    PAYMENT = 'PAYMENT',
    MANUAL = 'MANUAL',
    AUCTION = 'AUCTION',
}

export enum CashStatus {
    POSTED = 'POSTED',
    REVERSED = 'REVERSED',
}

export enum CashCategory {
    OPERATIONAL = 'OPERATIONAL',
    CAPITAL = 'CAPITAL',
    OTHER = 'OTHER',
}

export enum AuctionStatus {
    LISTED = 'LISTED',
    SOLD = 'SOLD',
    CANCELLED = 'CANCELLED',
}

export enum ContractStatus {
    DRAFT = 'DRAFT',
    FINAL = 'FINAL',
    VOID = 'VOID',
}

export enum DecisionValue {
    AUCTION = 'AUCTION',
    HOLD = 'HOLD',
}

// Entity Interfaces
export interface User {
    id: string;
    username: string;
    fullName: string;
    phone: string | null;
    isActive: boolean;
    roleId: string;
    branchId: string;
    createdAt: string;
    role?: Role;
    branch?: Branch;
}

export interface Role {
    id: string;
    name: RoleName;
    createdAt: string;
}

export interface Branch {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface Customer {
    id: string;
    code: string;
    nik: string;
    fullName: string;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Loan {
    id: string;
    code: string;
    status: LoanStatus;
    customerId: string;
    branchId: string;
    createdById: string;
    tenorMonths: number | null;
    startDate: string;
    dueDate: string;
    principalRp: number;
    adminFeeRp: number;
    finalizedAt: string | null;
    daysUsedFinal: number | null;
    interestRateBpsFinal: number | null;
    interestAmountRpFinal: number | null;
    totalDueRpFinal: number | null;
    createdAt: string;
    customer?: Customer;
    branch?: Branch;
    createdBy?: User;
    collaterals?: CollateralItem[];
    payments?: Payment[];
    auction?: {
        id: string;
        status: AuctionStatus;
    };
}

export interface CollateralItem {
    id: string;
    loanId: string | null;
    name: string;
    description: string | null;
    estimatedValueRp: number | null;
    createdAt: string;
    updatedAt?: string;
    loan?: {
        id: string;
        code: string;
        status: LoanStatus;
        customer?: {
            id: string;
            fullName: string;
            code: string;
        };
        auction?: {
            id: string;
            status: AuctionStatus;
        };
    };
}


export interface Payment {
    id: string;
    loanId: string;
    userId: string;
    branchId: string;
    amountRp: number;
    paidAt: string;
    note: string | null;
    createdAt: string;
    reversedAt: string | null;
    reversedBy: string | null;
    daysUsedSnapshot: number | null;
    interestRateSnapshotBps: number | null;
    interestAmountSnapshotRp: number | null;
    totalDueSnapshotRp: number | null;
    interestRecordedRp: number | null;
    principalRecordedRp: number | null;
    loan?: Loan;
    user?: User;
}

export interface CashLedger {
    id: string;
    branchId: string;
    userId: string;
    type: CashType;
    source: CashSource;
    amountRp: number;
    title: string;
    txnDate: string;
    note: string | null;
    createdAt: string;
    status: CashStatus;
    category: CashCategory;
    paymentId: string | null;
    reversalOfId: string | null;
    reversedById: string | null;
    reversedAt: string | null;
    deletedAt: string | null;
    branch?: Branch;
    user?: User;
}

export interface AuctionListing {
    id: string;
    loanId: string;
    branchId: string;
    createdById: string;
    status: AuctionStatus;
    listedAt: string;
    dueDateSnapshot: string;
    daysUsedSnapshot: number;
    interestAmountSnapshotRp: number;
    totalDueSnapshotRp: number;
    remainingSnapshotRp: number;
    closedAt: string | null;
    closedById: string | null;
    note: string | null;
    deletedAt: string | null;
    loan?: Loan;
    branch?: Branch;
    createdBy?: User;
    closedBy?: User;
}

export interface LoanContract {
    id: string;
    loanId: string;
    branchId: string;
    createdById: string;
    status: ContractStatus;
    contractNo: string | null;
    templateVersion: number;
    snapshotJson: any;
    snapshotHashSha256: string;
    finalizedAt: string | null;
    finalizedById: string | null;
    voidedAt: string | null;
    voidedById: string | null;
    voidReason: string | null;
    createdAt: string;
    loan?: Loan;
    branch?: Branch;
    createdBy?: User;
    finalizedBy?: User;
    voidedBy?: User;
}

export interface AuctionSettlement {
    id: string;
    auctionId: string;
    branchId: string;
    createdById: string;
    grossAmountRp: number;
    feesRp: number;
    netAmountRp: number;
    settledAt: string;
    note: string | null;
    createdAt: string;
    auction?: AuctionListing;
    branch?: Branch;
    createdBy?: User;
}

export interface CompanyProfile {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LoanDecision {
    id: string;
    loanId: string;
    userId: string;
    decision: DecisionValue;
    note: string | null;
    createdAt: string;
    loan?: Loan;
    user?: User;
}

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

// Auth Types
export interface LoginResponse {
    access_token: string;
    user: User;
}

export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    phone?: string;
    role: RoleName;
    branchId: string;
    branchName?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
    loans: {
        active: number;
        overdue: number;
        lunasThisMonth: number;
        totalAmount: number;
    };
    cash: {
        inToday: number;
        outToday: number;
        balance: number;
        changePercent: number;
    };
    payments: {
        totalToday: number;
        countToday: number;
        averageAmount: number;
        interestCollected: number;
    };
    auctions: {
        listed: number;
        dueThisWeek: number;
        soldThisMonth: number;
        totalValue: number;
    };
    customers: {
        total: number;
        newThisMonth: number;
    };
    users: {
        activeInBranch: number;
    };
}

// Form DTOs
export interface CreateCustomerDto {
    nik: string;
    fullName: string;
    phone?: string;
    address?: string;
}

export interface CreateLoanDto {
    customerId: string;
    tenorMonths?: number;
    startDate: string;
    dueDate: string;
    principalRp: number;
    adminFeeRp: number;
}

export interface CreateCollateralDto {
    loanId: string;
    name: string;
    description?: string;
    estimatedValueRp?: number;
}

export interface CreatePaymentDto {
    loanId: string;
    amountRp: number;
    paidAt: string;
    note?: string;
}

export interface CreateContractDto {
    loanId: string;
    templateVersion?: number;
}

export interface CreateCashLedgerDto {
    type: CashType;
    source: CashSource;
    amountRp: number;
    title: string;
    txnDate: string;
    note?: string;
    category: CashCategory;
}

// Unified Quick Create Form Data
export interface UnifiedQuickCreateData {
    customer: {
        isNew: boolean;
        customerId?: string;
        customerData?: CreateCustomerDto;
    };
    collaterals: Array<{
        name: string;
        description?: string;
        estimatedValueRp?: number;
    }>;
    loan: {
        tenorMonths?: number;
        startDate: string;
        dueDate: string;
        principalRp: number;
        adminFeeRp: number;
    };
    createContract: boolean;
}
