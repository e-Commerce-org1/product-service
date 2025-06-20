import { Inject, Injectable } from '@nestjs/common';
import { Product } from './schema/product.schema';
import { ProductDao } from './dao/product.dao';
import {
  CreateProductRequest,
  UpdateProductRequest,
  UpdateInventoryRequest,
  UpdateInventoryByOrderRequest,
  ProductFilter,
} from 'src/interfaces/helper.interface';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createProduct(data: CreateProductRequest): Promise<Product> {
    this.logger.info(LOG_MESSAGES.PRODUCT_CREATE_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    return this.productDao.createProductDao(data);
  }

  async updateProduct(data: UpdateProductRequest): Promise<Product> {
    this.logger.info(LOG_MESSAGES.PRODUCT_UPDATE_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    return this.productDao.updateProductDao(data);
  }

  async getProduct(id: string): Promise<Product> {
    this.logger.info(LOG_MESSAGES.PRODUCT_READ_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    const product = await this.productDao.getProductDao(id);
    if (!product) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  async listProducts(filter: ProductFilter) {
    this.logger.info(LOG_MESSAGES.PRODUCT_LIST_REQUESTED, {
      timestamp: new Date().toISOString(),
    });
    const page = filter.page !== undefined ? Number(filter.page) : 1;
    const pageSize =
      filter.pageSize !== undefined ? Number(filter.pageSize) : 10;

    const parsedFilter: ProductFilter = {
      ...filter,
      page,
      pageSize,
    };
    const { products, total } =
      await this.productDao.listProductsDao(parsedFilter);
    return {
      products,
      total,
      page,
      pageSize,
    };
  }

  async deleteProduct(data: { id: string }) {
    this.logger.info(LOG_MESSAGES.PRODUCT_DELETE_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    const res = await this.productDao.deleteProductDao(data.id);
    if (!res) {
      throw GrpcAppException.notFound(LOG_MESSAGES.PRODUCT_DELETE_FAILED);
    }
    return res;
  }

  async updateVariants(data: UpdateInventoryRequest): Promise<Product> {
    this.logger.info(LOG_MESSAGES.PRODUCT_VARIANTS_UPDATE_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    const updatedProduct = await this.productDao.updateVariantsDao(data);
    return updatedProduct;
  }

  async updateInventory(data: UpdateInventoryByOrderRequest) {
    this.logger.info(LOG_MESSAGES.INVENTORY_UPDATE_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    return await this.productDao.handleInventoryUpdate(data.items);
  }

  async filterProducts(searchTerm: string, filterDto: FilterProductsDto) {
    this.logger.info(LOG_MESSAGES.FILTER_PRODUCTS_REQUESTED, {
      timestamp: new Date().toISOString(),
    });
    return await this.productDao.filterProducts(searchTerm, filterDto);
  }

  async getProductWithSimilar(id: string) {
    this.logger.info(LOG_MESSAGES.GET_SIMILAR_PRODUCTS_INITIATED, {
      timestamp: new Date().toISOString(),
    });
    const data = await this.productDao.getProductWithSimilar(id);
    if (!data) {
      throw AppException.notFound(LOG_MESSAGES.FILTER_PRODUCTS_FAILED);
    }
    return data;
  }
}
