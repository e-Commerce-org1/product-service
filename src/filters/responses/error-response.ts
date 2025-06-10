import { HttpStatus } from '@nestjs/common';

export class ErrorResponse {
  static generate(
    statusCode: HttpStatus,
    message: string | string[],
    error: string,
    path: string,
  ) {
    return {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
