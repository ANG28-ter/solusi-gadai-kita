import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAuctionSettlementDto {
  @IsInt()
  @Min(1)
  grossAmountRp: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  feesRp?: number;

  @IsDateString()
  settledAt: string; // ISO string

  @IsOptional()
  @IsString()
  note?: string;
}
