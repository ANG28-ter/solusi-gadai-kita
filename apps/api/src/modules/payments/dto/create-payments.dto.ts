import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  loanId: string;

  @IsInt()
  amountRp: number;

  @IsNotEmpty()
  paidAt: string;

  @IsOptional()
  note?: string;
}
