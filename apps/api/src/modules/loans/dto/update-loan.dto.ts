import { IsOptional, IsInt, Min, IsArray, IsDateString } from 'class-validator';

export class UpdateLoanDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    principalRp?: number;

    @IsOptional()
    @IsArray()
    collateralIds?: string[];

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    adminFeeRp?: number;
}
