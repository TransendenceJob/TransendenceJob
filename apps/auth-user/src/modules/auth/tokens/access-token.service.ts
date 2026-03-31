import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthConfigService } from '../../config/auth-config.service';
import type { StringValue } from 'ms';
import {
  type AccessTokenClaims,
  type AccessTokenPayloadInput,
} from './token-contracts';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AuthConfigService,
  ) {}

  async generateAccessToken(payload: AccessTokenPayloadInput): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        sessionId: payload.sessionId,
      },
      {
        secret: this.config.jwt.accessSecret,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
        expiresIn: this.config.jwt.accessTtl as StringValue,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    let payload: AccessTokenClaims;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.jwt.accessSecret,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (
      !payload?.sub ||
      !payload?.email ||
      !Array.isArray(payload?.roles) ||
      !payload?.sessionId ||
      !payload?.iss ||
      !payload?.aud
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return payload;
  }
}
