import { IsArray, IsInt, IsUUID, Min } from 'class-validator';

export class CreateLoanDto {
  @IsUUID()
  customerId: string;

  @IsInt()
  @Min(1)
  principalRp: number;

  @IsArray()
  @IsUUID('all', { each: true })
  collateralIds: string[];

  @IsInt()
  @Min(0)
  adminFeeRp?: number;
}
