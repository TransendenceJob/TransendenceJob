import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import { AccessTokenService } from '../tokens/access-token.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';

@Injectable()
export class AuthTokenIssueService {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly authConfig: AuthConfigService,
  ) {}

  createRefreshTokenPair(): {
    refreshToken: string;
    refreshTokenHash: string;
    expiresAt: Date;
  } {
    return this.refreshTokens.createRefreshTokenPair();
  }

  issueAccessToken(input: {
    userId: string;
    email: string;
    roles: string[];
    sessionId: string;
  }): Promise<string> {
    return this.accessTokens.generateAccessToken({
      sub: input.userId,
      email: input.email,
      roles: input.roles,
      sessionId: input.sessionId,
    });
  }

  accessTokenExpiresInSeconds(): number {
    const jwtConfig = this.authConfig.jwt as { accessTtl?: string };
    return this.toSeconds(jwtConfig.accessTtl ?? '0s');
  }

  private toSeconds(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      default:
        return 0;
    }
  }
}
