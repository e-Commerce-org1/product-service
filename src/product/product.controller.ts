import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import { Types } from 'mongoose';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Get('')
    async filterProducts(@Query() filterDto: FilterProductsDto) {
        return this.productService.filterProducts(filterDto);
    }

    @Get(':id')
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
