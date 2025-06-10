import { RpcException } from '@nestjs/microservices';

export class GrpcAppException {
  static badRequest(message: string | string[] = 'Bad Request') {
    return new RpcException({
      code: 3, // INVALID_ARGUMENT
      status: 'Bad Request',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new RpcException({
      code: 16, // UNAUTHENTICATED
      status: 'Unauthorized',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static forbidden(message: string = 'Forbidden') {
    return new RpcException({
      code: 7, // PERMISSION_DENIED
      status: 'Forbidden',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static notFound(message: string = 'Not Found') {
    return new RpcException({
      code: 5, // NOT_FOUND
      status: 'Not Found',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static conflict(message: string = 'Conflict') {
    return new RpcException({
      code: 6, // ALREADY_EXISTS
      status: 'Conflict',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static internal(message: string = 'Internal Server Error') {
    return new RpcException({
      code: 13, // INTERNAL
      status: 'Internal Server Error',
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }

  static custom(code: number, status: string, message: string) {
    return new RpcException({
      code,
      status,
      timestamp: Date.now(),
      data: null,
      error: message,
    });
  }
}
