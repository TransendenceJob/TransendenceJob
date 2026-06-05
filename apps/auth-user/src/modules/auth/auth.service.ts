import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersAuthService } from '../users-auth/users-auth.service';
import { PasswordHashService } from './hashing/password-hash.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { AuditLogRepository } from '../persistence/repositories';
import { AuditAction } from '@prisma/client';
import { UserStatus } from '@prisma/client';
import { AuthSuccessResponseDto } from './contracts/dto/auth-success-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersAuthService,
    private readonly passwordHashService: PasswordHashService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async login(
    email: string,
    pass: string,
    userAgent: string,
    ip: string,
  ): Promise<AuthSuccessResponseDto> {
    const user = await this.usersService.findByEmail(email);

    const targetUserId = user?.id ?? null; // if user doesn't exist, targetUserId becomes null instead of crashing

    if (user && user.passwordHash) {
      const isMatch = await this.passwordHashService.compare(
        pass,
        user.passwordHash,
      );

      if (isMatch) {
        if (user.status === UserStatus.DISABLED) {
          await this.auditLogRepository.createEvent({
            action: AuditAction.LOGIN_FAILED,
            userId: targetUserId,
            actorUserId: targetUserId,
            ip,
            userAgent,
            metadataJson: { email, reason: 'DISABLED' },
          });
          throw new UnauthorizedException('Invalid email or password');
        }
        return await this.generateSuccessResponse(user, userAgent, ip);
      }
    }

    await this.auditLogRepository.createEvent({
      action: AuditAction.LOGIN_FAILED,
      userId: targetUserId,
      actorUserId: targetUserId,
      ip,
      userAgent,
      metadataJson: { email },
    });
    throw new UnauthorizedException('Invalid email or password');
  }

  private async generateSuccessResponse(
    user: any,
    userAgent: string,
    ip: string,
  ): Promise<AuthSuccessResponseDto> {
    const { sessionId, refreshToken, expiresAt } =
      await this.refreshTokenService.createSessionWithRefreshToken({
        userId: user.id,
        userAgent: userAgent,
        ipAddress: ip,
      });

    const accessToken = await this.accessTokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roleNames,
      sessionId: sessionId,
    });

    await this.auditLogRepository.createEvent({
      action: AuditAction.LOGIN_SUCCEEDED,
      userId: user.id,
      actorUserId: user.id,
      ip,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        roles: user.roleNames,
        displayName: user.email.split('@')[0],
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, //15min not sure if that is good number
        tokenType: 'Bearer',
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }
}
