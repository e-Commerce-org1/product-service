import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import {
  grpcService,
  grpcMethods,
  MESSAGES,
} from 'src/constants/grpc.constants';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductID,
  ProductFilter,
  Response,
  UpdateInventoryRequest,
  UpdateInventoryByOrderRequest,
} from 'src/interfaces/helper.interface';
import { ResponseHelper } from 'src/constants/response.helper';

@Controller()
export class ProductGrpcController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod(grpcService, grpcMethods.create)
  async createProduct(data: CreateProductRequest): Promise<Response> {
    try {
      const product = await this.productService.createProduct(data);
      return ResponseHelper.success(product);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.PRODUCT_NOT_CREATED);
    }
  }

  @GrpcMethod(grpcService, grpcMethods.update)
  async updateProduct(data: UpdateProductRequest): Promise<Response> {
    try {
      const product = await this.productService.updateProduct(data);
      return ResponseHelper.success(product);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.PRODUCT_UPDATE_ERROR);
    }
  }

  @GrpcMethod(grpcService, grpcMethods.get)
  async getProduct(data: ProductID): Promise<Response> {
    try {
      const product = await this.productService.getProduct(data.id);
      return ResponseHelper.success(product);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.PRODUCT_NOT_FOUND);
    }
  }

  @GrpcMethod(grpcService, grpcMethods.getList)
  async listProducts(filter: ProductFilter): Promise<Response> {
    const result = await this.productService.listProducts(filter);
    const data = {
      products: result.products,
      total: result.total,
      page: result.page || 1,
      pageSize: result.pageSize || 10,
    };
    return ResponseHelper.success(data);
  }

  @GrpcMethod(grpcService, grpcMethods.delete)
  async deleteProduct(data: { id: string }): Promise<Response> {
    try {
      const product = await this.productService.deleteProduct(data);
      return ResponseHelper.success(product);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.PRODUCT_DELETE_ERROR);
    }
  }

  @GrpcMethod(grpcService, grpcMethods.updateVariants)
  async updateVariants(data: UpdateInventoryRequest): Promise<Response> {
    try {
      const product = await this.productService.updateVariants(data);
      return ResponseHelper.success(product);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.VARIANT_UPDATE_ERROR);
    }
  }

  @GrpcMethod(grpcService, grpcMethods.updateInventory)
  async updateInventory(
    data: UpdateInventoryByOrderRequest,
  ): Promise<Response> {
    try {
      const result = await this.productService.updateInventory(data);
      return ResponseHelper.success(result);
    } catch (error) {
      return ResponseHelper.error(error, MESSAGES.INVENTORY_UPDATE_ERROR);
    }
  }
}
