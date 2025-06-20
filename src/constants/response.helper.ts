import { RESPONSE_CODES, STATUS } from './grpc.constants';
import { Response } from 'src/interfaces/helper.interface';
import { Logger } from '@nestjs/common';

const logger = new Logger('ResponseHelper');

export class ResponseHelper {
  static success(
    data: any,
    code = RESPONSE_CODES.SUCCESS,
    status = STATUS.SUCCESS,
  ): Response {
    return {
      code,
      status,
      timestamp: new Date().toString(),
      data: JSON.stringify(data),
      error: '',
    };
  }

  static error(
    error: any,
    message: string,
    code = RESPONSE_CODES.NOT_FOUND,
    status = STATUS.ERROR,
  ): Response {
    logger.error(message, error?.stack ?? error?.message ?? error);
    return {
      code,
      status,
      timestamp: new Date().toString(),
      data: JSON.stringify(error?.message ?? error),
      error: message,
    };
  }
}
