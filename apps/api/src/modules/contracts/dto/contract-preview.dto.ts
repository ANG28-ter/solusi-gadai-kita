export type ContractPreviewDTO = {
  templateVersion: number;

  company: {
    brand: string;
    legalName: string;
    ahu: string;
    addressLine: string;
    phone: string;
  };

  meta: {
    contractCode: string | null; // preview = null
    branchCode: string; // misal "01"
    transactionAt: string; // now ISO
    effectiveAt: string; // loan.startDate ISO
    dueAt: string; // loan.dueDate ISO
    cashierName: string; // user.fullName
  };

  customer: {
    nik: string;
    fullName: string;
    address: string | null;
    phone: string | null;
  };

  items: Array<{
    no: number;
    name: string;
    description: string | null;
    estimatedValueRp: number | null;
  }>;

  financial: {
    estimatedValueRp: number;
    principalRp: number;
    adminFeeRp: number;
    netDisbursedRp: number;
    tenorDays: number;
  };

  clauses: Array<{ no: number; text: string }>;
};
