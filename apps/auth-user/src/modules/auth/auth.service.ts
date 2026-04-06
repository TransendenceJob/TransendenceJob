import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersAuthService } from '../users-auth/users-auth.service';
import { PasswordHashService } from './hashing/password-hash.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersAuthService,
    private readonly passwordHashService: PasswordHashService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(email: string, pass: string, userAgent: string, ip: string) {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const isMatch = await this.passwordHashService.compare(
        pass,
        user.passwordHash,
      );
      if (isMatch) {
        if (user.status === 'disabled') {
          throw new UnauthorizedException('Account is disabled');
        }

        return this.generateSuccessResponse(user, userAgent, ip);
      }
    }

    // Generic error for both "User not found" and "Wrong password"
    throw new UnauthorizedException('Invalid email or password');
  }

  private async generateSuccessResponse(
    user: any,
    userAgent: string,
    ip: string,
  ) {
    const { sessionId, refreshToken } =
      await this.refreshTokenService.createSessionWithRefreshToken({
        userId: user.id,
        userAgent: userAgent,
        ipAddress: ip,
      });

    const accessToken = await this.accessTokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles as string[],
      sessionId: sessionId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        roles: user.roles,
        displayName: user.displayName,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: {
        id: sessionId,
      },
    };
  }
}
