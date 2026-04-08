import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { type RefreshRequestDto } from '../contracts/dto/refresh-request.dto';
import { type RefreshResponseDto } from '../contracts/dto/refresh-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AuthSessionCacheService } from '../shared/auth-session-cache.service';
import { AuthTokenIssueService } from '../shared/auth-token-issue.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';

export type RefreshContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
};

type RefreshTransactionResult = {
  user: {
    id: string;
    email: string;
    status: string;
  };
  roles: string[];
  session: {
    id: string;
    expiresAt: Date;
    revokedAt: Date | null;
  };
  refreshToken: string;
};

@Injectable()
export class AuthRefreshService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly tokenIssue: AuthTokenIssueService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly sessionCache: AuthSessionCacheService,
  ) {}

  findActiveByRefreshTokenHashWithUser(
    refreshTokenHash: string,
    db?: DbClient,
  ): Promise<SessionWithUser | null> {
    return this.db(db).session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async refresh(
    input: RefreshRequestDto,
    context: RefreshContext,
  ): Promise<RefreshResponseDto> {
    const refreshTokenHash = this.refreshTokens.hashRefreshToken(
      input.refreshToken,
    );

    const refreshed = await this.prisma.$transaction(
      async (db): Promise<RefreshTransactionResult> => {
        const session =
          await this.sessions.findActiveByRefreshTokenHashWithUser(
            refreshTokenHash,
            db,
          );

        if (!session) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        if (session.user.status !== 'ACTIVE' || session.user.disabledAt) {
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

        const roles = await this.users.getRoleNamesForUser(session.userId, db);
        const refreshTokenPair = this.tokenIssue.createRefreshTokenPair();
        const rotation = await this.sessions.updateRefreshTokenHashIfCurrent(
          session.id,
          session.refreshTokenHash,
          refreshTokenPair.refreshTokenHash,
          refreshTokenPair.expiresAt,
          db,
        );

        if (rotation.count === 0) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        await this.auditLogs.createEvent(
          {
            action: 'REFRESH_SUCCEEDED',
            userId: session.userId,
            actorUserId: session.userId,
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            metadataJson: {
              source: 'internal/auth/refresh',
              requestId: context.requestId ?? null,
              serviceName: context.serviceName ?? null,
              sessionId: session.id,
            },
          },
          db,
        );

        return {
          user: {
            id: session.user.id,
            email: session.user.email,
            status: session.user.status,
          },
          roles,
          session: {
            id: session.id,
            expiresAt: refreshTokenPair.expiresAt,
            revokedAt: null,
          },
          refreshToken: refreshTokenPair.refreshToken,
        };
      },
    );

    await this.sessionCache.cacheSession({
      session: {
        id: refreshed.session.id,
        expiresAt: refreshed.session.expiresAt,
      },
      user: {
        id: refreshed.user.id,
        status: refreshed.user.status,
      },
      roles: refreshed.roles,
      requestId: context.requestId,
      serviceName: context.serviceName,
    });

    const accessToken = await this.tokenIssue.issueAccessToken({
      userId: refreshed.user.id,
      email: refreshed.user.email,
      roles: refreshed.roles,
      sessionId: refreshed.session.id,
    });

    return AuthContractMapper.toRefreshResponse({
      session: refreshed.session,
      tokens: {
        accessToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: this.tokenIssue.accessTokenExpiresInSeconds(),
        tokenType: 'Bearer',
      },
    });
  }
}
