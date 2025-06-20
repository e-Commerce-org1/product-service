import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { DatabaseModule } from './database/database.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.logger';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    DatabaseModule,
    ProductModule,
    ReviewModule,
  ],
})
export class AppModule {}
