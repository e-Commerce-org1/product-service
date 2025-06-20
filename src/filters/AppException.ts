import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class AppException {
  static badRequest(message: string | string[]) {
    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
    });
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new UnauthorizedException({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Unauthorized',
    });
  }

  static forbidden(message: string = 'Forbidden') {
    return new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Forbidden',
    });
  }

  static notFound(message: string = 'Not Found') {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'Not Found',
    });
  }

  static conflict(message: string = 'Conflict') {
    return new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
    });
  }

  static internal(message: string = 'Internal Server Error') {
    return new InternalServerErrorException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Internal Server Error',
    });
  }

  static custom(
    statusCode: HttpStatus,
    message: string,
    error: string = 'Error',
  ) {
    return new HttpException(
      {
        statusCode,
        message,
        error,
      },
      statusCode,
    );
  }
}
