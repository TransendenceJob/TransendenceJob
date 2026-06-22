import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TracingHeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = this.readSingleHeader(req.headers['x-request-id']);
    const serviceName = this.readSingleHeader(req.headers['x-service-name']);

    if (requestId && requestId.length > 128) {
      throw new BadRequestException('Invalid tracing headers');
    }

    req.requestId = requestId?.trim() || randomUUID();
    req.serviceName = serviceName?.trim() || undefined;

    res.setHeader('X-Request-Id', req.requestId);
    if (req.serviceName) {
      res.setHeader('X-Service-Name', req.serviceName);
    }

    next();
  }

  private readSingleHeader(
    value: string | string[] | undefined,
  ): string | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return typeof value === 'string' ? value : null;
  }
}
