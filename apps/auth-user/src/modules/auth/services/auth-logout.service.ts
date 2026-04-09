import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { LogoutRequestDto } from '../contracts/dto/logout-request.dto';
import { LogoutResponseDto } from '../contracts/dto/logout-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AuthSessionCacheService } from '../shared/auth-session-cache.service';
import { AuthRateLimitService } from '../shared/auth-rate-limit.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';

export type LogoutContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
};

@Injectable()
export class AuthLogoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly refreshTokens: RefreshTokenService,
    private readonly sessionCache: AuthSessionCacheService,
    private readonly rateLimit: AuthRateLimitService,
  ) {}

  async logout(
    input: LogoutRequestDto,
    context: LogoutContext,
  ): Promise<LogoutResponseDto> {
    await this.rateLimit.ensureLogoutAllowed({
      ip: context.ip,
    });

    const refreshTokenHash = this.refreshTokens.hashRefreshToken(
      input.refreshToken,
    );

    const revokedSessionIds = await this.prisma.$transaction(async (db) => {
      const session = await this.sessions.findActiveByRefreshTokenHashWithUser(
        refreshTokenHash,
        db,
      );

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (
        !this.refreshTokens.verifyRefreshToken(
          input.refreshToken,
          session.refreshTokenHash,
        )
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const userId = session.userId;
      const revocationTime = new Date();
      const sessionIds: string[] = [];

      if (input.logoutAll) {
        const activeSessions = await this.sessions.findActiveSessionsByUserId(
          userId,
          db,
        );
        sessionIds.push(...activeSessions.map((s) => s.id));

        const result = await this.sessions.revokeAllSessionsForUser(
          userId,
          revocationTime,
          db,
        );

        await this.auditLogs.createEvent(
          {
            action: 'LOGOUT',
            userId,
            actorUserId: userId,
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            metadataJson: {
              source: 'internal/auth/logout',
              requestId: context.requestId ?? null,
              serviceName: context.serviceName ?? null,
              logoutAll: true,
              revokedCount: result.count,
            },
          },
          db,
        );
      } else {
        await this.sessions.revokeSession(session.id, revocationTime, db);

        sessionIds.push(session.id);

        await this.auditLogs.createEvent(
          {
            action: 'LOGOUT',
            userId,
            actorUserId: userId,
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            metadataJson: {
              source: 'internal/auth/logout',
              requestId: context.requestId ?? null,
              serviceName: context.serviceName ?? null,
              logoutAll: false,
              sessionId: session.id,
            },
          },
          db,
        );
      }

      return sessionIds;
    });

    for (const sessionId of revokedSessionIds) {
      await this.sessionCache.invalidateSession(sessionId);
    }

    return AuthContractMapper.toLogoutResponse(revokedSessionIds);
  }
}
