import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { RoleRepository } from '../../persistence/repositories/role.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { DisableUserRequestDto } from '../contracts/dto/disable-user-request.dto';
import { RevokeSessionsRequestDto } from '../contracts/dto/revoke-sessions-request.dto';
import { RevokeSessionsResponseDto } from '../contracts/dto/revoke-sessions-response.dto';
import { SetUserRolesRequestDto } from '../contracts/dto/set-user-roles-request.dto';
import { UserDisabledResponseDto } from '../contracts/dto/user-disabled-response.dto';
import { UserRolesResponseDto } from '../contracts/dto/user-roles-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AccessTokenService } from '../tokens/access-token.service';

const SERVICE_ACTOR_ALLOWLIST = new Set(['auth-service', 'system']);
const ROLE_NAME_MAP = {
  user: 'USER',
  moderator: 'MODERATOR',
  admin: 'ADMIN',
} as const;

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
    private readonly roles: RoleRepository,
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

  async setUserRoles(
    userId: string,
    input: SetUserRolesRequestDto,
    context: DisableUserContext,
  ): Promise<UserRolesResponseDto> {
    const actor = await this.authorize(context);
    const canonicalRoles = this.toCanonicalRoles(input.roles);

    const result = await this.prisma.$transaction(async (db) => {
      const user = await this.users.findById(userId, db);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const roleNames = await this.roles.replaceUserRoles(
        userId,
        canonicalRoles,
        db,
      );
      const updatedAt = new Date();

      const roleAudit = {
        action: 'ROLE_CHANGED',
        userId,
        actorUserId: actor.actorUserId,
        ip: context.ip ?? null,
        userAgent: context.userAgent ?? null,
        metadataJson: {
          source: 'internal/auth/users/role',
          requestId: context.requestId ?? null,
          serviceName: context.serviceName ?? null,
          roles: roleNames,
          authMode: actor.authMode,
        },
      } satisfies Parameters<AuditLogRepository['createEvent']>[0];

      await this.auditLogs.createEvent(roleAudit, db);

      return {
        roleNames,
        updatedAt,
      };
    });

    return AuthContractMapper.toUserRolesResponse({
      userId,
      roleNames: result.roleNames,
      updatedAt: result.updatedAt,
    });
  }

  async revokeUserSessions(
    userId: string,
    input: RevokeSessionsRequestDto,
    context: DisableUserContext,
  ): Promise<RevokeSessionsResponseDto> {
    const actor = await this.authorize(context);

    const revokedSessions = await this.prisma.$transaction(async (db) => {
      const user = await this.users.findById(userId, db);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const revokedAt = new Date();
      const revoked = await this.sessions.revokeAllSessionsForUser(
        userId,
        revokedAt,
        db,
      );

      await this.auditLogs.createEvent(
        {
          action: 'SESSION_REVOKED',
          userId,
          actorUserId: actor.actorUserId,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/users/sessions/revoke',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            reason: input.reason ?? null,
            revokedSessions: revoked.count,
            authMode: actor.authMode,
          },
        },
        db,
      );

      return revoked.count;
    });

    return AuthContractMapper.toRevokeSessionsResponse(userId, revokedSessions);
  }

  private toCanonicalRoles(inputRoles: readonly string[]): string[] {
    const canonicalRoles = inputRoles.map((role) => {
      const normalizedRole = role
        .trim()
        .toLowerCase() as keyof typeof ROLE_NAME_MAP;
      const canonicalRole = ROLE_NAME_MAP[normalizedRole];

      if (!canonicalRole) {
        throw new BadRequestException(`Unsupported role: ${role}`);
      }

      return canonicalRole;
    });

    return Array.from(new Set(canonicalRoles));
  }

  private async authorize(
    context: DisableUserContext,
  ): Promise<AuthorizedActor> {
    const token = context.bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const claims = await this.accessTokens.verifyAccessToken(token);
    const roleSet = new Set(claims.roles.map((role) => role.toUpperCase()));

    if (roleSet.has('ADMIN')) {
      return {
        actorUserId: claims.sub,
        authMode: 'admin',
      } satisfies AuthorizedActor;
    }

    const serviceName = context.serviceName?.trim().toLowerCase();
    const isTrustedService =
      roleSet.has('SERVICE') &&
      typeof serviceName === 'string' &&
      SERVICE_ACTOR_ALLOWLIST.has(serviceName);

    if (!isTrustedService) {
      throw new ForbiddenException('Admin role required');
    }

    return {
      actorUserId: claims.sub,
      authMode: 'service',
    } satisfies AuthorizedActor;
  }
}
