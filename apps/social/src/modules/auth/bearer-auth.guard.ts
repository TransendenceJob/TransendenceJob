import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ActiveSessionService } from './active-session.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly activeSessions: ActiveSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    request.authPrincipal =
      await this.activeSessions.verifyActivePrincipal(token);

    return true;
  }
}
