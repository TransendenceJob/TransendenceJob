import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenService } from '../../tokens/access-token.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.bearerToken;

    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const claims = await this.accessTokens.verifyAccessToken(token);

    request.authPrincipal = {
      token,
      claims,
      roleSet: new Set(claims.roles.map((role) => role.toUpperCase())),
    };

    return true;
  }
}
