import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class LoanPolicyService {
  private readonly MAX_LTV = 0.7;

  validateAgainstCollateral(params: {
    principalRp: number;
    totalCollateralValueRp: number;
  }) {
    const { principalRp, totalCollateralValueRp } = params;

    if (totalCollateralValueRp <= 0) {
      throw new BadRequestException('Nilai taksiran belum tersedia atau nol');
    }

    const maxAllowed = Math.floor(totalCollateralValueRp * this.MAX_LTV);

    if (principalRp > maxAllowed) {
      throw new BadRequestException(
        `Nilai pinjaman melebihi batas. Maksimal Rp ${maxAllowed}`,
      );
    }
  }
}
