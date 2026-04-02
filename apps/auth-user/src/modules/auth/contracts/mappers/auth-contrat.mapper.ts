import {
  AuthProviderType,
  AuditAction,
  Prisma,
  UserStatus,
} from '@prisma/client';
import { UserStatusDto } from '../enums/user-status.enum';
import { UserRoleDto } from '../enums/user-role.enum';
import { AuditActionDto } from '../enums/audit-action.enum';
import { SessionInfoViewModel } from '../view-models/session-info.view-model';
import { AuditLogItemViewModel } from '../view-models/audit-log-item.view-model';
import { UserAuthViewModel } from '../view-models/user-auth.view-model';

type UserWithRealtions = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    authProviders: true;
  };
}>;

export class AuthContractMapper {
  static toUserStatusDto(status: UserStatus): UserStatusDto {
    switch (status) {
      case UserStatus.ACTIVE:
        return UserStatusDto.ACTIVE;
      case UserStatus.DISABLED:
        return UserStatusDto.DISABLED;
      case UserStatus.PENDING_VERIFICATION:
        return UserStatusDto.PENDING;
    }
  }

  static toUserRoleDto(roleName: string): UserRoleDto {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return UserRoleDto.ADMIN;
      case 'moderator':
        return UserRoleDto.MODERATOR;
      default:
        return UserRoleDto.USER;
    }
  }

  static toAuditActionDto(action: AuditAction): AuditActionDto {
    switch (action) {
      case AuditAction.USER_REGISTERED:
        return AuditActionDto.REGISTER;
      case AuditAction.LOGIN_SUCCEEDED:
        return AuditActionDto.LOGIN_SUCCESS;
      case AuditAction.LOGIN_FAILED:
        return AuditActionDto.LOGIN_FAILED;
      case AuditAction.REFRESH_SUCCEEDED:
        return AuditActionDto.TOKEN_REFRESH;
      case AuditAction.LOGOUT:
        return AuditActionDto.LOGOUT;
      case AuditAction.USER_DISABLED:
        return AuditActionDto.USER_DISABLED;
      case AuditAction.ROLE_ASSIGNED:
      case AuditAction.ROLE_REMOVED:
      case AuditAction.ROLE_CHANGED:
        return AuditActionDto.ROLE_UPDATED;
      case AuditAction.SESSION_REVOKED:
        return AuditActionDto.SESSIONS_REVOKED;
      default:
        return AuditActionDto.LOGIN_FAILED;
    }
  }

  static toProviderName(provider: AuthProviderType): string {
    switch (provider) {
      case AuthProviderType.GOOGLE:
        return 'google';
      case AuthProviderType.LOCAL:
        return 'local';
      case AuthProviderType.GITHUB:
        return 'github';
      case AuthProviderType.FORTY_TWO:
        return '42';
    }
  }

  static toSessionInfo(session: {
    id: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }): SessionInfoViewModel {
    return {
      id: session.id,
      expiresAt: session.expiresAt.toISOString(),
      revoked: !!session.revokedAt,
    };
  }

  static toUserAuthView(user: UserWithRelations): UserAuthViewModel {
    return {
      id: user.id,
      email: user.email,
      displayName: null,
      username: null,
      status: this.toUserStatusDto(user.status),
      roles: user.roles.map((entry) => this.toUserRoleDto(entry.role.name)),
      createdAt: user.createdAt?.toISOString() ?? null,
      providers: user.authProviders.map((provider) => ({
        name: this.toProviderName(provider.provider),
        providerUserId: provider.providerUserId,
      })),
    };
  }

  static toAuditLogItem(log: {
    id: string;
    userId: string | null;
    actorUserId: string | null;
    action: AuditAction;
    ip: string | null;
    userAgent: string | null;
    metadataJson: Prisma.JsonValue | null;
    createdAt: Date;
  }): AuditLogItemViewModel {
    return {
      id: log.id,
      userId: log.userId,
      actorUserId: log.actorUserId,
      action: this.toAuditActionDto(log.action),
      ip: log.ip,
      userAgent: log.userAgent,
      metadata:
        log.metadataJson && typeof log.metadataJson === 'object'
          ? (log.metadataJson as Record<string, unknown>)
          : {},
      createdAt: log.createdAt.toISOString(),
    };
  }
}
