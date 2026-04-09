import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * Catches all exceptions and formats them as JSON responses.
   * HttpExceptions are returned with their configured status and message.
   * Unknown errors default to 500 Internal Server Error.
   * @param exception - The thrown exception (caught by NestJS)
   * @param host - The execution context containing request/response objects
   * @returns JSON-formatted error response sent to client
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      res.status(status).json({
        statusCode: status,
        path: req?.url,
        error: response,
      });
      return;
    }

    // Fallback for unexpected errors
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: req?.url,
      error: { message: 'Internal error' },
    });
  }
}
