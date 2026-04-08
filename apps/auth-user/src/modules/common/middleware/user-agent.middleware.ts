import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const userAgentHeader = this.readSingleHeader(req.headers['user-agent']);
    req.userAgent = userAgentHeader;
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
