import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './schema/product.schema';
import { productDao } from './dao/product.dao';
import { CreateProductRequest, UpdateProductRequest, UpdateInventoryRequest,} from '../proto/product';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FilterProductsDto } from './dto/filter-products.dto';
import { GrpcAppException } from 'src/filters/GrpcAppException';
import { AppException } from 'src/filters/AppException';

@Injectable()
export class ProductService {
  constructor( 
    private readonly productDao: productDao,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger 
  ) {}

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      this.logger.info("Product create Request!", {timestamp:  new Date().toISOString()})
      const newProduct = this.productDao.createProductDao(data);
      return newProduct;
    }catch(error){
      this.logger.error('Failed to create product',{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.badRequest('Failed to create Product! ');
    }
    
  }

  async updateProduct(data: UpdateProductRequest): Promise<Product> {
    try {
      this.logger.info("Product update request!", {timestamp:  new Date().toISOString()});
      return this.productDao.updateProductDao(data);
    } catch (error) {
      this.logger.error('Failed to update product',{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.badRequest('Failed to update product!');
    }
    
  }

  async getProduct(id: string): Promise<Product> {
    try {
      this.logger.info("Product read request!", {timestamp:  new Date().toISOString()});
      const product = this.productDao.getProductDao(id);
      if(!product){
        throw GrpcAppException.notFound('Product not Found!');
      }
      return product;
    } catch (error) {
      throw GrpcAppException.notFound('Product not Found!');
    }
    
  }

  async listProducts(filter: any) {
    try {
      this.logger.info("All Product request as List", {timestamp:  new Date().toISOString()});
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 10;
      const { products, total } = await this.productDao.listProductsDao(filter);
      return {
        products: products.map((product) => this.mapToResponse(product)),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('Failed to create product',{ error, timestamp: new Date().toISOString()});
      // throw new GrpcBadRequestException('Failed to list Products');
      throw GrpcAppException.badRequest('Failed to list Products!');
    }
  }


  async deleteProduct(data: { id: string }){
    try{
      this.logger.info("Product deleted request! ", {timestamp:  new Date().toISOString()});
      const res = await this.productDao.deleteProductDao(data.id);
      if(!res){
        throw GrpcAppException.notFound('In Delete route, Product Not Found with ID');
      }
      return res;
    }
    catch(error){
      throw GrpcAppException.notFound('In Delete route, Product Not Found !');
    }
  }

  async updateVariants(data: UpdateInventoryRequest): Promise<Product> {
    try {
      this.logger.info("Product variants updated request!", {timestamp:  new Date().toISOString()});
      const updatedProduct = await this.productDao.updateVariantsDao(data);
      return updatedProduct;
    } catch (error) {
      throw GrpcAppException.notFound('In Updating the variants, Product not found !');
    }
    
  }

  async filterProducts(filterDto: FilterProductsDto){
    this.logger.info("Http Request for filter product!", {timestamp: new Date().toISOString()});
    return await this.productDao.filterProducts(filterDto);
  }

  async getProductWithSimilar(id: string){
    try {
      this.logger.info("Get Product Details with similar product request!", {timestamp: new Date().toISOString()});
      const data = await this.productDao.getProductWithSimilar(id);
      if(!data){
        throw AppException.notFound(`Product Not Found with ID: ${id}`);
      }
      return data;
    } catch (error) {
      throw AppException.notFound(`Product Not Found with ID: ${id}`);
    }
    
  }

  mapToResponse(product: any) {
    return {
      id: product._id.toString(),
      name: product.name,
      categoryName: product.categoryName,
      brand: product.brand,
      imageUrl: product.imageUrl,
      description: product.description,
      price: product.price,
      totalStock: product.totalStock,
      variants: (product.variants || []).map(v => ({
        id: v._id.toString(),
        size: v.size,
        color: v.color,
        stock: v.stock
      }))
    };
  }
}
