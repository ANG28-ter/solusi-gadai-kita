export type TransactionReportRowType = 'PAYMENT' | 'AUCTION' | 'EXPENSE';

export interface TransactionReportQuery {
  branchId: string;
  startDate: Date;
  endDate: Date;
  q?: string; // search (optional) on name/title
  includeExpenses?: boolean; // default false
}

export interface TransactionReportRow {
  no: number;
  date: Date;
  name: string;
  pemasukanRp: number;
  pengeluaranRp: number;

  // optional traceability (not shown in UI but useful for drilldown)
  ref?: {
    type: TransactionReportRowType;
    paymentId?: string;
    auctionSettlementId?: string;
    cashLedgerId?: string;
    loanId?: string;
    loanCode?: string;
  };
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
    period: { from: Date; to: Date };
    generatedAt: Date;
    includeExpenses: boolean;
    q?: string;
  };
}
