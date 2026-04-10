import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  ALLOW_TRUSTED_SERVICE_KEY,
  ROLES_KEY,
} from '../decorators/roles.decorator';
import type { AuthPrincipal, AuthRole } from '../auth-principal';

const SERVICE_ACTOR_ALLOWLIST = new Set(['auth-service', 'system']);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const allowTrustedService =
      this.reflector.getAllAndOverride<boolean>(ALLOW_TRUSTED_SERVICE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const request = context.switchToHttp().getRequest<Request>();
    const principal = request.authPrincipal as AuthPrincipal | undefined;
    const roleSet = principal?.roleSet;

    if (!principal || !roleSet) {
      throw new ForbiddenException('Authenticated principal is required');
    }

    const hasRequiredRole = requiredRoles.some((role) => roleSet.has(role));
    if (hasRequiredRole) {
      return true;
    }

    const serviceName = request.serviceName?.trim().toLowerCase();
    const isTrustedService =
      allowTrustedService &&
      roleSet.has('SERVICE') &&
      typeof serviceName === 'string' &&
      SERVICE_ACTOR_ALLOWLIST.has(serviceName);

    if (isTrustedService) {
      return true;
    }

    throw new ForbiddenException('Required role is missing');
  }
}
