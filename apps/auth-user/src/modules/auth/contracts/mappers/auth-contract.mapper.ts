import { AuditListResponseDto } from '../dto/audit-list-response.dto';
import { AuthSuccessResponseDto } from '../dto/auth-success-response.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { RefreshResponseDto } from '../dto/refresh-response.dto';
import { RevokeSessionsResponseDto } from '../dto/revoke-sessions-response.dto';
import { UserDisabledResponseDto } from '../dto/user-disabled-response.dto';
import { UserRolesResponseDto } from '../dto/user-roles-response.dto';
import { VerifyResponseDto } from '../dto/verify-response.dto';
import { UserStatusDto } from '../enums/user-status.enum';
import { UserRoleDto } from '../enums/user-role.enum';
import { AuditActionDto } from '../enums/audit-action.enum';
import { PageInfoViewModel } from '../view-models/page-info.view-model';
import { SessionInfoViewModel } from '../view-models/session-info.view-model';
import { AuditLogItemViewModel } from '../view-models/audit-log-item.view-model';
import { TokenPairViewModel } from '../view-models/token-pair.view-model';
import { UserAuthViewModel } from '../view-models/user-auth.view-model';
import { VerifyClaimsViewModel } from '../view-models/verify-claims.view-model';

type UserWithRelations = {
  id: string;
  email: string;
  status: string;
  createdAt?: Date | null;
  roles: Array<{ role: { name: string } }>;
  authProviders: Array<{ provider: string; providerUserId: string }>;
};

export class AuthContractMapper {
  static toUserStatusDto(status: string): UserStatusDto {
    switch (status) {
      case 'ACTIVE':
        return UserStatusDto.ACTIVE;
      case 'DISABLED':
        return UserStatusDto.DISABLED;
      case 'PENDING_VERIFICATION':
        return UserStatusDto.PENDING;
      default:
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

  static toAuditActionDto(action: string): AuditActionDto {
    switch (action) {
      case 'USER_REGISTERED':
      case 'USER_VERIFIED':
        return AuditActionDto.REGISTER;
      case 'LOGIN_SUCCEEDED':
        return AuditActionDto.LOGIN_SUCCESS;
      case 'LOGIN_FAILED':
        return AuditActionDto.LOGIN_FAILED;
      case 'REFRESH_SUCCEEDED':
      case 'REFRESH_FAILED':
      case 'PASSWORD_RESET_REQUESTED':
      case 'PASSWORD_RESET_COMPLETED':
        return AuditActionDto.TOKEN_REFRESH;
      case 'LOGOUT':
        return AuditActionDto.LOGOUT;
      case 'SESSION_REVOKED':
        return AuditActionDto.SESSIONS_REVOKED;
      case 'GOOGLE_EXCHANGE':
        return AuditActionDto.GOOGLE_EXCHANGE;
      case 'USER_ENABLED':
      case 'USER_DISABLED':
        return AuditActionDto.USER_DISABLED;
      case 'ROLE_ASSIGNED':
      case 'ROLE_REMOVED':
      case 'ROLE_CHANGED':
        return AuditActionDto.ROLE_UPDATED;
      default:
        return AuditActionDto.TOKEN_REFRESH;
    }
  }

  static toProviderName(provider: string): string {
    switch (provider) {
      case 'GOOGLE':
        return 'google';
      case 'LOCAL':
        return 'local';
      case 'GITHUB':
        return 'github';
      case 'FORTY_TWO':
        return '42';
      default:
        return provider.toLowerCase();
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

  static toTokenPair(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType?: string;
  }): TokenPairViewModel {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType ?? 'Bearer',
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
    action: string;
    ip: string | null;
    userAgent: string | null;
    metadataJson: unknown;
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
        log.metadataJson &&
        typeof log.metadataJson === 'object' &&
        !Array.isArray(log.metadataJson)
          ? (log.metadataJson as Record<string, unknown>)
          : {},
      createdAt: log.createdAt.toISOString(),
    };
  }

  static toPageInfo(nextCursor: string | null): PageInfoViewModel {
    return {
      nextCursor,
      hasNextPage: nextCursor !== null,
    };
  }

  static toAuthSuccessResponse(input: {
    user: UserWithRelations;
    session: { id: string; expiresAt: Date; revokedAt: Date | null };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType?: string;
    };
  }): AuthSuccessResponseDto {
    return {
      user: this.toUserAuthView(input.user),
      session: this.toSessionInfo(input.session),
      tokens: this.toTokenPair(input.tokens),
    };
  }

  static toRefreshResponse(input: {
    session: { id: string; expiresAt: Date; revokedAt: Date | null };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType?: string;
    };
  }): RefreshResponseDto {
    return {
      session: this.toSessionInfo(input.session),
      tokens: this.toTokenPair(input.tokens),
    };
  }

  static toVerifyResponse(input: {
    user: UserWithRelations;
    session: { id: string; expiresAt: Date; revokedAt: Date | null };
    claims: VerifyClaimsViewModel;
  }): VerifyResponseDto {
    return {
      valid: true,
      user: this.toUserAuthView(input.user),
      session: this.toSessionInfo(input.session),
      claims: input.claims,
    };
  }

  static toLogoutResponse(revokedSessionIds: string[]): LogoutResponseDto {
    return {
      success: true,
      revokedSessionIds,
    };
  }

  static toUserDisabledResponse(
    userId: string,
    revokedSessions: number,
  ): UserDisabledResponseDto {
    return {
      userId,
      status: UserStatusDto.DISABLED,
      revokedSessions,
    };
  }

  static toUserRolesResponse(input: {
    userId: string;
    roleNames: string[];
    updatedAt: Date;
  }): UserRolesResponseDto {
    return {
      userId: input.userId,
      roles: input.roleNames.map((roleName) => this.toUserRoleDto(roleName)),
      updatedAt: input.updatedAt.toISOString(),
    };
  }

  static toRevokeSessionsResponse(
    userId: string,
    revokedSessions: number,
  ): RevokeSessionsResponseDto {
    return {
      userId,
      revokedSessions,
    };
  }

  static toAuditListResponse(input: {
    logs: Array<{
      id: string;
      userId: string | null;
      actorUserId: string | null;
      action: string;
      ip: string | null;
      userAgent: string | null;
      metadataJson: unknown;
      createdAt: Date;
    }>;
    nextCursor: string | null;
  }): AuditListResponseDto {
    return {
      items: input.logs.map((log) => this.toAuditLogItem(log)),
      pageInfo: this.toPageInfo(input.nextCursor),
    };
  }
}
