import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { MovementType } from '@prisma/client';

export class StockActionDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustStockDto extends StockActionDto {}

export class MovementQueryDto {
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @IsOptional()
  @IsString()
  productId?: string;
}
