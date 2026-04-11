import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auditContext } from 'src/modules/audit/audit.context';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // check if the client already sent a request id
    let incoming = req.headers['x-request-id'];

    // If not, generate one
    const requestId = typeof incoming === "string" ? incoming : uuid();

    // Attach it to the request object for later use in handlers/logging
    auditContext.run({ requestId }, () => {
      res.setHeader('X-Request-Id', requestId);
      next();
    });
    
  }
}
