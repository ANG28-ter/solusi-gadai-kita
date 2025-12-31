import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DecisionValue } from '@prisma/client';

export class CreateLoanDecisionDto {
  @IsEnum(DecisionValue)
  decision: DecisionValue;

  @IsOptional()
  @IsString()
  @MinLength(3)
  note?: string;
}
