import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { grpcService, grpcMethods } from '../constants/grpc.constants'
import { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductID,
  ProductFilter,
  Response,
  UpdateInventoryRequest
} from '../proto/product';

@Controller()
export class ProductGrpcController {
  logger: any;
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod(grpcService, grpcMethods.create)
  async createProduct(data: CreateProductRequest): Promise<Response> {
    try{
      const product = await this.productService.createProduct(data);

      return {
        code: 200,
        status: 'success',
        timestamp: Date.now().toString(),
        data: JSON.stringify(product),
        error: '',
      };
    }
    catch (error){
      return {
        code: 404,
        status: 'error',
        timestamp: Date.now().toString(),
        data: JSON.stringify(error.message),
        error: 'Product not created something went wrong',
      };
    }
  }

  @GrpcMethod(grpcService, grpcMethods.update)
  async updateProduct(data: UpdateProductRequest): Promise<Response> {
    try{
      const product = await this.productService.updateProduct(data);

      return {
        code: 200,
        status: 'success',
        timestamp: Date.now().toString(),
        data: JSON.stringify(product),
        error: '',
      };
    } catch (error){

      return {
        code: 404,
        status: 'error',
        timestamp: Date.now().toString(),
        data: JSON.stringify(error.message),
        error: 'While updating something went wrong!',
      };
    }
  }

  @GrpcMethod(grpcService, grpcMethods.get)
  async getProduct(data: ProductID): Promise<Response> {
    try{
      const product = await this.productService.getProduct(data.id);

      return {
        code: 200,
        status: 'success',
        timestamp: Date.now().toString(),
        data: JSON.stringify(product),
        error: '',
      };
    } catch (error) {

      return {
        code: 404,
        status: 'error',
        timestamp: Date.now().toString(),
        data: JSON.stringify(error.message),
        error: 'Product not found',
      };
    }
  }

  // @GrpcMethod(grpcService, grpcMethods.getList)
  // async listProducts(filter: ProductFilter): Promise<ProductListResponse> {
  //   const result = await this.productService.listProducts(filter);
  //   return {
  //     products: result.products,
  //     total: result.total,
  //     page: result.page || 1,
  //     pageSize: result.pageSize || 10
  //   };
  // }

  @GrpcMethod(grpcService, grpcMethods.delete)
  async deleteProduct(data: { id: string }): Promise<Response> {
    try{
      const product =  this.productService.deleteProduct(data);

      return {
        code: 200,
        status: 'success',
        timestamp: Date.now().toString(),
        data: JSON.stringify(product),
        error: '',
      };
    } catch (error) {

      return {
        code: 404,
        status: 'error',
        timestamp: Date.now().toString(),
        data: JSON.stringify(error.message),
        error: 'Product not found or deleted',
      };
    }
  }

  @GrpcMethod(grpcService, grpcMethods.updateVariants)
  async updateVariants(data: UpdateInventoryRequest) {
    try {
      const product =  this.productService.updateVariants(data);

      return {
        code: 200,
        status: 'success',
        timestamp: Date.now().toString(),
        data: JSON.stringify(product),
        error: '',
      };
    } catch (error) {

      return {
        code: 404,
        status: 'error',
        timestamp: Date.now().toString(),
        data: error.message,
        error: 'While updating variants something went wrong!',
      };
    }
  }
}