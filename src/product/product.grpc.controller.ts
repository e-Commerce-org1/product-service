import { Controller, ForbiddenException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { status } from '@grpc/grpc-js';
import { grpcService, grpcMethods } from '../constants/grpc.constants'
import { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductID,
  ProductFilter,
  ProductResponse,
  ProductListResponse
} from '../proto/product';

@Controller()
export class ProductGrpcController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod(grpcService, grpcMethods.create)
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    // throw new ForbiddenException();
    const product = await this.productService.createProduct(data);
    return this.productService.mapToResponse(product);
  }

  @GrpcMethod(grpcService, grpcMethods.update)
  async updateProduct(data: UpdateProductRequest): Promise<ProductResponse> {
    const product = await this.productService.updateProduct(data);
    return this.productService.mapToResponse(product);
  }

  @GrpcMethod(grpcService, grpcMethods.get)
  async getProduct(data: ProductID): Promise<ProductResponse> {
    const product = await this.productService.getProduct(data.id);
    if (!product) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Product not found'
      });
    }
    return this.productService.mapToResponse(product);
  }

  @GrpcMethod(grpcService, grpcMethods.getList)
  async listProducts(filter: ProductFilter): Promise<ProductListResponse> {
    const result = await this.productService.listProducts(filter);
    return {
      products: result.products,
      total: result.total,
      page: result.page || 1,
      pageSize: result.pageSize || 10
    };
  }
}