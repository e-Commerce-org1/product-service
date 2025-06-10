import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Get('/')
    @ApiOperation({ summary: 'Filter products by category, brand, subcategory, or name' })
    @ApiResponse({ status: 200, description: 'Filtered products with metadata' })
    async filterProducts(@Query() filterDto: FilterProductsDto) {
        console.log("Requested products");
        return this.productService.filterProducts(filterDto);
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Get product details with similar products' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Product and similar products' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async getProductDetails(@Param('id') id: string) {
        try{
            if (!Types.ObjectId.isValid(id)) {
                throw new NotFoundException('Invalid product ID');
            }

            return this.productService.getProductWithSimilar(id);
        }catch (error){
            return {
                message: "Product not found",
            }
        }
        
    }
}
