import { Inject, Injectable } from '@nestjs/common';
import { Product } from './schema/product.schema';
import { ProductDao } from './dao/product.dao';
import { CreateProductRequest, UpdateProductRequest, UpdateInventoryRequest, UpdateInventoryByOrderRequest, ProductFilter} from 'src/interfaces/helper.interface';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FilterProductsDto } from './dto/filter-products.dto';
import { GrpcAppException } from 'src/filters/GrpcAppException';
import { AppException } from 'src/filters/AppException';
import { ERROR_MESSAGES, LOG_MESSAGES } from 'src/constants/app.constants';

@Injectable()
export class ProductService {
  constructor( 
    private readonly productDao: ProductDao,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger 
  ) {}

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      this.logger.info(LOG_MESSAGES.PRODUCT_CREATE_INITIATED, {timestamp:  new Date().toISOString()})
      return this.productDao.createProductDao(data);
    }catch(error){
      this.logger.error(ERROR_MESSAGES.PRODUCT_CREATE_FAILED,{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.badRequest(ERROR_MESSAGES.PRODUCT_CREATE_FAILED);
    }
    
  }

  async updateProduct(data: UpdateProductRequest): Promise<Product> {
    try {
      this.logger.info(LOG_MESSAGES.PRODUCT_UPDATE_INITIATED, {timestamp:  new Date().toISOString()});
      return this.productDao.updateProductDao(data);
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.badRequest(ERROR_MESSAGES.PRODUCT_UPDATE_FAILED);
    }
    
  }

  async getProduct(id: string): Promise<Product> {
    try {
      this.logger.info(LOG_MESSAGES.PRODUCT_READ_INITIATED, {timestamp:  new Date().toISOString()});
      const product = this.productDao.getProductDao(id);
      if(!product){
        throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }
      return product;
    } catch (error) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    
  }

  async listProducts(filter: ProductFilter) {
    try {
      this.logger.info(LOG_MESSAGES.PRODUCT_LIST_REQUESTED, {timestamp:  new Date().toISOString()});
      // Parse page and pageSize as numbers, with fallback defaults
      console.log(filter);
      const page = filter.page !== undefined ? Number(filter.page) : 1;
      const pageSize = filter.pageSize !== undefined ? Number(filter.pageSize) : 10;

      // Create a new filter object with correct types
      const parsedFilter: ProductFilter = {
        ...filter,
        page,
        pageSize,
      };
      const { products, total } = await this.productDao.listProductsDao(parsedFilter);
      return {
        products: products.map((product) => this.mapToResponse(product)),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.PRODUCT_LIST_FAILED,{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.badRequest(ERROR_MESSAGES.PRODUCT_LIST_FAILED);
    }
  }


  async deleteProduct(data: { id: string }){
    try{
      this.logger.info(LOG_MESSAGES.PRODUCT_DELETE_INITIATED, {timestamp:  new Date().toISOString()});
      const res = await this.productDao.deleteProductDao(data.id);
      if(!res){
        throw GrpcAppException.notFound(LOG_MESSAGES.PRODUCT_DELETE_FAILED);
      }
      return res;
    }
    catch(error){
      this.logger.error(ERROR_MESSAGES.PRODUCT_DELETE_FAILED,{ error, timestamp: new Date().toISOString()});
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_DELETE_FAILED);
    }
  }

  async updateVariants(data: UpdateInventoryRequest): Promise<Product> {
    try {
      this.logger.info(LOG_MESSAGES.PRODUCT_VARIANTS_UPDATE_INITIATED, {timestamp:  new Date().toISOString()});
      const updatedProduct = await this.productDao.updateVariantsDao(data);
      return updatedProduct;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.PRODUCT_VARIANTS_UPDATE_FAILED, {timestamp:  new Date().toISOString()});
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_VARIANTS_UPDATE_FAILED);
    }
  }

  async updateInventory(data: UpdateInventoryByOrderRequest){
    this.logger.info(LOG_MESSAGES.INVENTORY_UPDATE_INITIATED, {timestamp:  new Date().toISOString()});
    return await this.productDao.handleInventoryUpdate(data.items);
  }

  async filterProducts(searchTerm: string, filterDto: FilterProductsDto){
    this.logger.info(LOG_MESSAGES.FILTER_PRODUCTS_REQUESTED, {timestamp: new Date().toISOString()});
    return await this.productDao.filterProducts(searchTerm,filterDto);
  }

  async getProductWithSimilar(id: string){
    try {
      this.logger.info(LOG_MESSAGES.GET_SIMILAR_PRODUCTS_INITIATED, {timestamp: new Date().toISOString()});
      const data = await this.productDao.getProductWithSimilar(id);
      if(!data){
        throw AppException.notFound(LOG_MESSAGES.FILTER_PRODUCTS_FAILED);
      }
      return data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.SIMILAR_PRODUCTS_NOT_FOUND, {timestamp:  new Date().toISOString()})
      throw AppException.notFound(ERROR_MESSAGES.SIMILAR_PRODUCTS_NOT_FOUND);
    }
    
  }

  private mapToResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      gender : product.gender,
      brand: product.brand,
      imageUrl: product.imageUrl,
      description: product.description,
      price: product.price,
      totalStock: product.totalStock,
      variants: (product.variants || []).map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock
      }))
    };
  }
}
