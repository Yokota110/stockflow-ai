import { IsString, IsOptional, IsArray, ValidateNested, IsInt, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class POItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantityOrdered: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  items: POItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  items?: POItemDto[];
}

export class ReceiveItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(1)
  quantityReceived: number;
}

export class ReceivePODto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
