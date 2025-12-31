export type ContractStatus = 'FINAL' | 'VOID';

export type ContractListItem = {
    id: string;
    contractNo: string;
    status: ContractStatus;
    templateVersion: number;

    finalizedAt: string | null;
    voidedAt: string | null;
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

export type ContractListResponse = {
    data: ContractListItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};
