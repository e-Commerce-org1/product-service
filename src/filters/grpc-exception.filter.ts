import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { GrpcException } from './exceptions/grpc.exception';

@Catch(GrpcException)
export class GrpcExceptionFilter implements RpcExceptionFilter<GrpcException> {
  catch(exception: GrpcException, host: ArgumentsHost): Observable<any> {
    const error = {
      code: exception.code,
      message: exception.message,
      details: exception.details
    };
    
    console.error('gRPC Error:', error);
    return throwError(() => error);
  }
}