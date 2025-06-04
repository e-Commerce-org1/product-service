import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { packageName } from './constants/grpc.constants';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { GrpcExceptionFilter } from './filters/grpc-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.logger';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger : WinstonModule.createLogger(winstonConfig)
  });

  // gRPC microservice setup
  const grpcPort = process.env.GRPC_SERVER_URL;
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: packageName,
      protoPath: join(__dirname, './proto/product.proto'),
      url: grpcPort
    }
  });

  await app.startAllMicroservices();
  app.useGlobalFilters(new GrpcExceptionFilter());
  
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Grpc Service is running on: ${grpcPort}`, 'Bootstrap');
  logger.log(`Database is connected to ${process.env.MONGODB_URI}`, 'Bootstrap');
}
bootstrap();
