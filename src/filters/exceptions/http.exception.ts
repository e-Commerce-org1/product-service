import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpExceptionExtended extends HttpException {
  constructor(
    public readonly statusCode: HttpStatus,
    public readonly message: string,
    public readonly details?: any
  ) {
    super({ statusCode, message, details }, statusCode);
  }
}