import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterProductsDto {
  @ApiPropertyOptional({ description: 'Filter by category name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by subcategory name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by brand name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  color?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  page: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  gender?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  price?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  sort?: string;

  @ApiPropertyOptional({
    description: 'Search by product name (partial match)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  ProductName?: string;
}
