import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import { auditContext } from 'src/modules/audit/audit.context';
// import { auditContext } from '../audit/audit.context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const audit = auditContext.getStore() || {};

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Unique constraint failed, user already exist';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          break;
      }
    }

    else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object') {
        const r = response as any;

        // 🔥 THIS is the important part
        message = r.message || r.error || exception.message;
      }
    }

    // Unknown errors
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Logging (with request context 🔥)
    this.logger.error({
      requestId: audit.requestId,
      actorId: audit.actorId,
      path: request.url,
      method: request.method,
      status,
      message,
      stack: exception instanceof Error ? exception.stack : null,
    });

    response.status(status).json({
      statusCode: status,
      message,
      requestId: audit.requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

// import {
//   ArgumentsHost,
//   Catch,
//   ExceptionFilter,
//   HttpException,
//   HttpStatus,
// } from '@nestjs/common';
// import { Request, Response } from 'express';

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   /**
//    * Catches all exceptions and formats them as JSON responses.
//    * HttpExceptions are returned with their configured status and message.
//    * Unknown errors default to 500 Internal Server Error.
//    * @param exception - The thrown exception (caught by NestJS)
//    * @param host - The execution context containing request/response objects
//    * @returns JSON-formatted error response sent to client
//    */
//   catch(exception: unknown, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const res = ctx.getResponse<Response>();
//     const req = ctx.getRequest<Request>();

//     if (exception instanceof HttpException) {
//       const status = exception.getStatus();
//       const response = exception.getResponse();
//       res.status(status).json({
//         statusCode: status,
//         path: req?.url,
//         error: response,
//       });
//       return;
//     }

//     // Fallback for unexpected errors
//     res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
//       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//       path: req?.url,
//       error: { message: 'Internal error' },
//     });
//   }
// }
