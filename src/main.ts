import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { packageName } from './constants/grpc.constants';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './filters/http-exception.filter';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger : WinstonModule.createLogger(winstonConfig)
  });

  app.enableCors();
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
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  // Global Filters
  // app.useGlobalFilters(new AllExceptionsFilter());
  // app.useGlobalFilters(new GrpcExceptionFilter(logger));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Product Service')
    .setDescription('API documentation for product service')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // HTTP Server Setup
  const httpPort = process.env.HTTP_PORT || 5000;
  await app.listen(httpPort);
  
  // const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`HTTP Server is running on: http://localhost:${httpPort}`, 'Bootstrap');
  logger.log(`gRPC Service is running on: ${grpcPort}`, 'Bootstrap');
  logger.log(`Database is connected to ${process.env.MONGODB_URI}`, 'Bootstrap');
}
bootstrap();
