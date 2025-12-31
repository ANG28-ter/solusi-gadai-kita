export type ContractListItemDTO = {
    id: string;
    contractNo: string;
    status: 'FINAL' | 'VOID';
    templateVersion: number;

    finalizedAt: Date | null;
    voidedAt: Date | null;
    voidReason: string | null;

    loan: {
        id: string;
        code: string;
        principalRp: number;
        status: string;
        customer: {
            id: string;
            fullName: string;
            nik: string;
        };
    };

    branch: {
        id: string;
        name: string;
        code: string;
    };
};

export type ContractListQueryDTO = {
    page?: number;
    limit?: number;
    search?: string; // search by contract no, customer name, or loan code
    status?: 'FINAL' | 'VOID' | 'ALL';
    branchId?: string;
};
