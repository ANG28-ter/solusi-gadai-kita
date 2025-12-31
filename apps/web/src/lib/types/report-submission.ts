// Report Submission Types
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISED';

export interface TransactionReportRow {
    no: number;
    date: string;
    name: string;
    pemasukanRp: number;
    pengeluaranRp: number;
}

export interface TransactionReportSummary {
    totalPemasukanRp: number;
    totalPengeluaranRp: number;
    saldoRp: number;
}

export interface TransactionReportResult {
    data: TransactionReportRow[];
    summary: TransactionReportSummary;
    meta: {
        branchId: string;
        period: { from: string; to: string };
        generatedAt: string;
        includeExpenses: boolean;
    };
}

export interface ReportSubmission {
    id: string;
    branchId: string;
    submittedBy: string;
    periodStart: string;
    periodEnd: string;
    reportData: TransactionReportResult;
    physicalCashRp: number;
    status: ReportStatus;
    submittedAt: string;
    note?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNote?: string;
    submitter: {
        id: string;
        fullName: string;
        username: string;
    };
    reviewer?: {
        id: string;
        fullName: string;
        username: string;
    };
    branch?: {
        id: string;
        name: string;
    };
}

export interface SubmitReportPayload {
    periodStart: string;
    periodEnd: string;
    reportData: TransactionReportResult;
    physicalCashRp: number;
    note?: string;
}

export interface ReviewReportPayload {
    status: 'APPROVED' | 'REJECTED' | 'REVISED';
    reviewNote?: string;
}
