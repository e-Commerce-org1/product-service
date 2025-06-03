import { Catch, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter{
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const errorResponse : {
      code: number;
      message: string;
      details?: string;
    }  = {
      code: exception.code,
      message: exception.message,
      details: exception.details
    };
    
    if(exception instanceof RpcException) {
      const res = exception.getError();
      if (typeof res === 'object' && res !== null) {
        errorResponse.code = (res as any).code ?? status.INTERNAL;
        errorResponse.message = (res as any).message ?? 'RpcException';
        errorResponse.details = (res as any).details ?? 'Internal Server Error';
      } else if (typeof res === 'string') {
        errorResponse.message = res;
      }
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
    }
    
    this.logger.error(
      `gRPC Error: ${errorResponse.message} (code: ${errorResponse.code})`,
      (exception as any)?.stack || '',
    );

    return throwError(() => errorResponse);
  }
}