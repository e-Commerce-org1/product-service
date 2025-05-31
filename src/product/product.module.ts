import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductGrpcController } from './product.grpc.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schema/product.schema';
import { Variant, VariantSchema } from './schema/variant.schema';
import { productDao } from 'src/product/dao/product.dao';
// import winston from 'winston/lib/winston/config';
// import { WinstonLogger } from 'nest-winston';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Variant.name, schema: VariantSchema }]),
  ],
  controllers: [ProductGrpcController],
  providers: [ProductService,productDao],
})
export class ProductModule {}
