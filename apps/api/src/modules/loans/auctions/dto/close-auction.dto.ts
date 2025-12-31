import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AuctionStatus } from '@prisma/client';

export class CloseAuctionDto {
  @IsEnum(AuctionStatus)
  status: AuctionStatus; // SOLD / CANCELLED

  @IsOptional()
  @IsString()
  @MinLength(3)
  note?: string;
}
