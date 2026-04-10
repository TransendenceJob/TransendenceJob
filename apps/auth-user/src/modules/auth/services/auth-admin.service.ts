import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { DisableUserRequestDto } from '../contracts/dto/disable-user-request.dto';
import { UserDisabledResponseDto } from '../contracts/dto/user-disabled-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AccessTokenService } from '../tokens/access-token.service';

const SERVICE_ACTOR_ALLOWLIST = new Set(['auth-service', 'system', 'admin']);

type AuthMode = 'admin' | 'service';

export type DisableUserContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string;
  serviceName?: string;
  bearerToken?: string;
};

type AuthorizedActor = {
  actorUserId: string | null;
  authMode: AuthMode;
};

@Injectable()
export class AuthAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async disableUser(
    userId: string,
    input: DisableUserRequestDto,
    context: DisableUserContext,
  ): Promise<UserDisabledResponseDto> {
    const actor = await this.authorize(context);

    const result = await this.prisma.$transaction(async (db) => {
      const user = await this.users.findById(userId, db);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const disabledAt = new Date();
      await this.users.disableUser(userId, disabledAt, db);

      let revokedSessions = 0;
      if (input.revokeSessions) {
        const revoked = await this.sessions.revokeAllSessionsForUser(
          userId,
          disabledAt,
          db,
        );
        revokedSessions = revoked.count;
      }

      await this.auditLogs.createEvent(
        {
          action: 'USER_DISABLED',
          userId,
          actorUserId: actor.actorUserId,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/users/disable',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            reason: input.reason,
            revokeSessions: input.revokeSessions,
            revokedSessions,
            authMode: actor.authMode,
          },
        },
        db,
      );

      return revokedSessions;
    });

    return AuthContractMapper.toUserDisabledResponse(userId, result);
  }

  private async authorize(
    context: DisableUserContext,
  ): Promise<AuthorizedActor> {
    const serviceName = context.serviceName?.trim().toLowerCase();

    if (serviceName && SERVICE_ACTOR_ALLOWLIST.has(serviceName)) {
      return {
        actorUserId: null,
        authMode: 'service',
      } satisfies AuthorizedActor;
    }

    const token = context.bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const claims = await this.accessTokens.verifyAccessToken(token);
    const hasAdminRole = claims.roles.some(
      (role) => role.toUpperCase() === 'ADMIN',
    );

    if (!hasAdminRole) {
      throw new ForbiddenException('Admin role required');
    }

    return {
      actorUserId: claims.sub,
      authMode: 'admin',
    } satisfies AuthorizedActor;
  }
}
