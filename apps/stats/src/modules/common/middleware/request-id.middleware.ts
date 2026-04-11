import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // check if the client already sent a request id
    let requestId = req.headers['x-request-id'] as string | undefined;

    // If not, generate one
    if (!requestId) {
      requestId = uuid();
    }

    // Attach it to the request object for later use in handlers/logging
    (req as any).requestId = requestId;

    // Also send it back as a response header
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
