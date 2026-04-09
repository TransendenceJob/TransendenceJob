import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuditAction, UserStatus } from '@prisma/client';
import { RegisterRequestDto } from '../contracts/dto/register-request.dto';
import { AuthSuccessResponseDto } from '../contracts/dto/auth-success-response.dto';
import { RefreshRequestDto } from '../contracts/dto/refresh-request.dto';
import { RefreshResponseDto } from '../contracts/dto/refresh-response.dto';
import { LogoutRequestDto } from '../contracts/dto/logout-request.dto';
import { LogoutResponseDto } from '../contracts/dto/logout-response.dto';
import { VerifyResponseDto } from '../contracts/dto/verify-response.dto';
import {
  AuthRegisterService,
  type RegisterContext,
} from './auth-register.service';
import {
  AuthRefreshService,
  type RefreshContext,
} from './auth-refresh.service';
import { AuthLogoutService, type LogoutContext } from './auth-logout.service';
import { AuthVerifyService, type VerifyInput } from './auth-verify.service';
import { UsersAuthService } from '../../users-auth/users-auth.service';
import { PasswordHashService } from '../hashing/password-hash.service';
import { AccessTokenService } from '../tokens/access-token.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';
import { AuditLogRepository } from '../../persistence/repositories';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRegisterService: AuthRegisterService,
    private readonly authRefreshService: AuthRefreshService,
    private readonly authLogoutService: AuthLogoutService,
    private readonly authVerifyService: AuthVerifyService,
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

    const targetUserId = user?.id ?? null;

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

  register(
    input: RegisterRequestDto,
    context: RegisterContext,
  ): Promise<AuthSuccessResponseDto> {
    return this.authRegisterService.register(input, context);
  }

  refresh(
    input: RefreshRequestDto,
    context: RefreshContext,
  ): Promise<RefreshResponseDto> {
    return this.authRefreshService.refresh(input, context);
  }

  logout(
    input: LogoutRequestDto,
    context: LogoutContext,
  ): Promise<LogoutResponseDto> {
    return this.authLogoutService.logout(input, context);
  }

  verify(input: VerifyInput): Promise<VerifyResponseDto> {
    return this.authVerifyService.verify(input);
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
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }
}
