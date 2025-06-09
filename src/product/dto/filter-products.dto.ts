import { IsOptional, IsString } from 'class-validator';

export class FilterProductsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subCategory?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  ProductName?: string;
}
