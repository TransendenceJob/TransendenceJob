import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const authorizationHeader = this.readSingleHeader(
      req.headers.authorization,
    );

    if (!authorizationHeader) {
      req.bearerToken = undefined;
      next();
      return;
    }

    const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);
    if (rest.length > 0 || scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    req.bearerToken = token;
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
