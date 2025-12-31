import { IsOptional, IsString } from 'class-validator';

export class FindCustomersQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
