import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export class GrpcBadRequestException extends RpcException {
  constructor(message: string) {
    super({ code: status.INVALID_ARGUMENT, message });
  }
}

export class GrpcNotFoundException extends RpcException {
  constructor(message: string) {
    super({ code: status.NOT_FOUND, message });
  }
}

export class GrpcUnauthorizedException extends RpcException {
  constructor(message: string) {
    super({ code: status.UNAUTHENTICATED, message });
  }
}

export class GrpcInternalException extends RpcException {
  constructor(message = 'Internal server error') {
    super({ code: status.INTERNAL, message });
  }
}
