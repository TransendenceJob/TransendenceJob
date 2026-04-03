import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TraceHeadersDto } from '../../auth/contracts/headers/trace-headers.dto';

@Injectable()
export class TracingHeaderMiddleware implements NestMiddleware {
  /**
   * Normalizes and validates tracing headers once at the boundary.
   * The middleware accepts external hyphenated headers and populates
   * internal camelCase request fields used by services/controllers.
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const requestIdHeader = this.readSingleHeader(req.headers['x-request-id']);
    const serviceNameHeader = this.readSingleHeader(
      req.headers['x-service-name'],
    );

    const normalized = plainToInstance(TraceHeadersDto, {
      xRequestId: requestIdHeader?.trim() || randomUUID(),
      xServiceName: serviceNameHeader?.trim() || undefined,
    });

    const errors = validateSync(normalized);
    if (errors.length > 0) {
      throw new BadRequestException('Invalid tracing headers');
    }

    req.requestId = normalized.xRequestId;
    req.serviceName = normalized.xServiceName;

    res.setHeader('X-Request-Id', normalized.xRequestId ?? randomUUID());
    if (normalized.xServiceName) {
      res.setHeader('X-Service-Name', normalized.xServiceName);
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
