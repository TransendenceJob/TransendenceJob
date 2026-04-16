import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type AuditAction, type AuditLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogRepository } from '../../persistence/repositories/audit-log.repository';
import { RoleRepository } from '../../persistence/repositories/role.repository';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { DisableUserRequestDto } from '../contracts/dto/disable-user-request.dto';
import { RevokeSessionsRequestDto } from '../contracts/dto/revoke-sessions-request.dto';
import { RevokeSessionsResponseDto } from '../contracts/dto/revoke-sessions-response.dto';
import { AuditListResponseDto } from '../contracts/dto/audit-list-response.dto';
import { AuditQueryDto } from '../contracts/dto/audit-query.dto';
import { SetPasswordRequestDto } from '../contracts/dto/set-password-request.dto';
import { SetPasswordResponseDto } from '../contracts/dto/set-password-response.dto';
import { AuditActionDto } from '../contracts/enums/audit-action.enum';
import { SetUserRolesRequestDto } from '../contracts/dto/set-user-roles-request.dto';
import { UserDisabledResponseDto } from '../contracts/dto/user-disabled-response.dto';
import { UserRolesResponseDto } from '../contracts/dto/user-roles-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { PasswordHashService } from '../hashing/password-hash.service';
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

function isMappedRole(role: string): role is keyof typeof ROLE_NAME_MAP {
  return role in ROLE_NAME_MAP;
}

@Injectable()
export class AuthAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly sessions: SessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly passwordHash: PasswordHashService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async setOwnPassword(
    input: SetPasswordRequestDto,
    context: DisableUserContext,
  ): Promise<SetPasswordResponseDto> {
    const token = context.bearerToken;
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const claims = await this.accessTokens.verifyAccessToken(token);
    const currentUser = await this.users.findById(claims.sub);

    if (!currentUser) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (currentUser.status !== 'ACTIVE' || currentUser.disabledAt) {
      throw new ForbiddenException('User is disabled');
    }

    const passwordHash = await this.passwordHash.hashPassword(input.password);

    await this.prisma.$transaction(async (db) => {
      await this.users.setPasswordHash(currentUser.id, passwordHash, db);

      await this.auditLogs.createEvent(
        {
          action: 'PASSWORD_RESET_COMPLETED',
          userId: currentUser.id,
          actorUserId: currentUser.id,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          metadataJson: {
            source: 'internal/auth/password/set',
            requestId: context.requestId ?? null,
            serviceName: context.serviceName ?? null,
            hadPassword: !!currentUser.passwordHash,
          },
        },
        db,
      );
    });

    return {
      success: true,
    } satisfies SetPasswordResponseDto;
  }

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

  async listAuditLogs(
    input: AuditQueryDto,
    context: DisableUserContext,
  ): Promise<AuditListResponseDto> {
    await this.authorize(context);

    const limit = input.limit ?? 20;
    const actions = this.toAuditActions(input.action);
    const logs = await this.auditLogs.searchAuditLogs({
      userId: input.userId,
      action: actions,
      cursor: input.cursor,
      take: limit + 1,
    });

    const hasNextPage = logs.length > limit;
    const pageItems = hasNextPage ? logs.slice(0, limit) : logs;
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1].id : null;

    return {
      items: pageItems.map((log) => this.toAuditLogItem(log)),
      pageInfo: AuthContractMapper.toPageInfo(nextCursor),
    };
  }

  private toCanonicalRoles(inputRoles: readonly string[]): string[] {
    const canonicalRoles = inputRoles.map((role) => {
      const normalizedRole = role.trim().toLowerCase();

      if (!isMappedRole(normalizedRole)) {
        throw new BadRequestException(`Unsupported role: ${role}`);
      }

      const canonicalRole = ROLE_NAME_MAP[normalizedRole];

      return canonicalRole;
    });

    return Array.from(new Set(canonicalRoles));
  }

  private toAuditActions(action?: AuditActionDto): AuditAction[] | undefined {
    if (!action) {
      return undefined;
    }

    switch (action) {
      case AuditActionDto.REGISTER:
        return ['USER_REGISTERED', 'USER_VERIFIED'];
      case AuditActionDto.LOGIN_SUCCESS:
        return ['LOGIN_SUCCEEDED'];
      case AuditActionDto.LOGIN_FAILED:
        return ['LOGIN_FAILED'];
      case AuditActionDto.LOGOUT:
        return ['LOGOUT'];
      case AuditActionDto.TOKEN_REFRESH:
        return [
          'REFRESH_SUCCEEDED',
          'REFRESH_FAILED',
          'PASSWORD_RESET_REQUESTED',
          'PASSWORD_RESET_COMPLETED',
        ];
      case AuditActionDto.GOOGLE_EXCHANGE:
        return ['GOOGLE_EXCHANGE'];
      case AuditActionDto.USER_DISABLED:
        return ['USER_DISABLED', 'USER_ENABLED'];
      case AuditActionDto.ROLE_UPDATED:
        return ['ROLE_ASSIGNED', 'ROLE_REMOVED', 'ROLE_CHANGED'];
      case AuditActionDto.SESSIONS_REVOKED:
        return ['SESSION_REVOKED'];
    }
  }

  private toAuditLogItem(log: AuditLog): AuditListResponseDto['items'][number] {
    return AuthContractMapper.toAuditLogItem({
      id: log.id,
      userId: log.userId,
      actorUserId: log.actorUserId,
      action: log.action,
      ip: log.ip,
      userAgent: log.userAgent,
      metadataJson: log.metadataJson,
      createdAt: log.createdAt,
    });
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
      throw new ForbiddenException('Admin or trusted service role required');
    }

    return {
      actorUserId: claims.sub,
      authMode: 'service',
    } satisfies AuthorizedActor;
  }
}
