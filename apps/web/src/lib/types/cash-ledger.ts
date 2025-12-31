// Cash Ledger Types
export type CashType = 'IN' | 'OUT';

export type CashSource =
    | 'LOAN_DISBURSEMENT'
    | 'PAYMENT_PRINCIPAL'
    | 'PAYMENT_INTEREST'
    | 'PAYMENT_ADMIN_FEE'
    | 'AUCTION_PROCEEDS'
    | 'MANUAL';

export type CashStatus = 'POSTED' | 'REVERSED';

export interface CashLedgerEntry {
    id: string;
    branchId: string;
    userId: string;
    type: CashType;
    source: CashSource;
    amountRp: number;
    title: string;
    txnDate: string;
    note?: string;
    status: CashStatus;
    createdAt: string;
    paymentId?: string;

    // Optional relations
    payment?: {
        id: string;
        loan: {
            code: string;
            customer: {
                fullName: string;
            };
        };
    };
}

export interface CashLedgerListResponse {
    data: CashLedgerEntry[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CashLedgerSummary {
    totalIn: number;
    totalOut: number;
    balance: number;
}
