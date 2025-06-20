import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { ERROR_MESSAGES, LOG_MESSAGES } from 'src/constants/app.constants';
import { AppException } from 'src/filters/AppException';
import { ResponseHelper } from 'src/constants/response.helper';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':searchTerm')
  @ApiOperation({
    summary: 'Filter products by category, brand, subcategory, or name',
  })
  @ApiResponse({ status: 200, description: 'Filtered products with metadata' })
  async filterProducts(
    @Param('searchTerm') searchTerm: string,
    @Query() filterDto: FilterProductsDto,
  ) {
    const data = await this.productService.filterProducts(
      searchTerm,
      filterDto,
    );
    return data;
  }

  @Get('details/:id')
  @ApiOperation({ summary: 'Get product details with similar products' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product and similar products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductDetails(@Param('id') id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw AppException.notFound(LOG_MESSAGES.PRODUCT_READ_FAILED);
      }

      const data = await this.productService.getProductWithSimilar(id);
      return data;
    } catch (error) {
      return ResponseHelper.error(error, ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
  }
}
