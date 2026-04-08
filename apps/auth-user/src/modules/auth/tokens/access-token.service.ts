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

  /**
   * Generates a signed access token (short-lived JWT).
   * Contains user claims (sub, email, roles, sessionId).
   * @param payload - The token payload with subject, email, roles, and session ID
   * @returns Promise resolving to the signed access token string
   * @throws No direct exceptions; uses JWT library settings
   * @example
   * const token = await accessTokenService.generateAccessToken({
   *   sub: 'user-123',
   *   email: 'user@example.com',
   *   roles: ['USER'],
   *   sessionId: 'session-456'
   * });
   */
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

  /**
   * Verifies and decodes an access token.
   * Validates signature, issuer, audience, and required claims.
   * @param token - The access token string to verify
   * @returns Promise resolving to decoded token claims
   * @throws UnauthorizedException if token is invalid, expired, or missing claims
   * @example
   * try {
   *   const claims = await accessTokenService.verifyAccessToken(token);
   *   console.log('User:', claims.sub, 'Roles:', claims.roles);
   * } catch (error) {
   *   // Token is invalid or expired
   * }
   */
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
      !payload?.aud ||
      typeof payload?.iat !== 'number' ||
      typeof payload?.exp !== 'number'
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return payload;
  }
}
