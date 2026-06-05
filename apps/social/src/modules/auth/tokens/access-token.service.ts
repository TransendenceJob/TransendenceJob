import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocialConfigService } from '../../config/social-config.service';
import type { AccessTokenClaims } from './token-contracts';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: SocialConfigService,
  ) {}

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    let claims: AccessTokenClaims;

    try {
      claims = await this.jwtService.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.jwt.accessSecret,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (
      !claims?.sub ||
      !claims?.email ||
      !Array.isArray(claims.roles) ||
      !claims.sessionId ||
      typeof claims.iat !== 'number' ||
      typeof claims.exp !== 'number'
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return claims;
  }
}
