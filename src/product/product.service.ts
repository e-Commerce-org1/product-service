import { Inject, Injectable } from '@nestjs/common';
import { Product } from './schema/product.schema';
import { productDao } from './dao/product.dao';
import { 
  CreateProductRequest,
  UpdateProductRequest,
  UpdateInventoryRequest
} from '../proto/product';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { GrpcBadRequestException, GrpcNotFoundException } from 'src/filters/custom-exceptions';

@Injectable()
export class ProductService {
  constructor( 
    private readonly productDao: productDao,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger 
  ) {}

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      const newProduct = this.productDao.createProductDao(data);
      return newProduct;
    }catch(error){
      this.logger.error('Failed to create product',{ error, timestamp: new Date().toISOString()});
      throw new GrpcBadRequestException('Failed to create product')
    }
    
  }

  async updateProduct(data: UpdateProductRequest): Promise<Product> {
    try {
      return this.productDao.updateProductDao(data);
    } catch (error) {
      this.logger.error('Failed to update product',{ error, timestamp: new Date().toISOString()});
      throw new GrpcBadRequestException('Failed to update product');
    }
    
  }

  async getProduct(id: string): Promise<Product> {
    const product = this.productDao.getProductDao(id);
    return product;
  }

  // async listProducts(filter: any): Promise<ProductListResponse> {
  //   try {
  //     const page = filter.page || 1;
  //     const pageSize = filter.pageSize || 10;
  //     const { products, total } = await this.productDao.listProductsDao(filter);
  //     return {
  //       products: products.map((product) => this.mapToResponse(product)),
  //       total,
  //       page,
  //       pageSize,
  //     };
  //   } catch (error) {
  //     this.logger.error('Failed to create product',{ error, timestamp: new Date().toISOString()});
  //     throw new GrpcBadRequestException('Failed to list Products')
  //   }
  // }


  async deleteProduct(data: { id: string }){
    return this.productDao.deleteProductDao(data.id);
  }

  async updateVariants(data: UpdateInventoryRequest): Promise<Product> {
    const updatedProduct = await this.productDao.updateVariantsDao(data);
    return updatedProduct;
  }

  // mapToResponse(product: any): ProductResponse {
  //   return {
  //     id: product._id.toString(),
  //     name: product.name,
  //     categoryName: product.categoryName,
  //     brand: product.brand,
  //     imageUrl: product.imageUrl,
  //     description: product.description,
  //     price: product.price,
  //     totalStock: product.totalStock,
  //     variants: (product.variants || []).map(v => ({
  //       id: v._id.toString(),
  //       size: v.size,
  //       color: v.color,
  //       stock: v.stock
  //     }))
  //   };
  // }
}
