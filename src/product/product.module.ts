import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductGrpcController } from './product.grpc.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';
import { Variant, VariantSchema } from './schema/variant.schema';
import { ProductDao } from 'src/product/dao/product.dao';
import { ProductController } from './product.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Variant.name, schema: VariantSchema }]),
  ],
  controllers: [ProductController, ProductGrpcController],
  providers: [ProductService, ProductDao],
  exports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
})
export class ProductModule {}
