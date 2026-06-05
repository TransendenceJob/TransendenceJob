export type RegisterRequestDto = {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type SetPasswordRequestDto = {
  password: string;
};

export type GoogleExchangeRequestDto = {
  provider: 'google';
  authorizationCode?: string;
  idToken?: string;
  redirectUri?: string;
};

export type GoogleCallbackQueryDto = {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
};

export type LogoutRequestDto = {
  refreshToken: string;
  logoutAll?: boolean;
};

export type RefreshRequestDto = {
  refreshToken: string;
};

export type ProviderLinkDto = {
  provider: string;
  providerUserId: string;
};

export type AuthUserDto = {
  id: string;
  email: string;
  status: string;
  roles?: string[];
  displayName?: string;
  username?: string;
  providers?: ProviderLinkDto[];
};

export type TokenPairDto = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export type SessionInfoDto = {
  id: string;
  expiresAt: string;
  revoked?: boolean | null;
};

export type VerifyClaimsDto = {
  sub: string;
  iat: number;
  exp: number;
  iss: string;
  aud?: string | null;
};

export type AuthSuccessResponseDto = {
  success: true;
  user: AuthUserDto;
  tokens: TokenPairDto;
  session: SessionInfoDto;
};

export type RefreshResponseDto = {
  success: true;
  tokens: TokenPairDto;
  session: SessionInfoDto;
};

export type LogoutResponseDto = {
  success: true;
  revokedSessionIds: string[];
};

export type SetPasswordResponseDto = {
  success: true;
};

export type VerifyResponseDto = {
  success: true;
  valid: boolean;
  user: AuthUserDto;
  session: SessionInfoDto;
  claims: VerifyClaimsDto;
};

export type AuthMeResponseDto = {
  success: true;
  user: AuthUserDto;
  session: SessionInfoDto;
  claims: VerifyClaimsDto;
};

export type ApiErrorDto = {
  code: string;
  message: string;
  details?: unknown;
};

export type InternalAuthSuccessResponse = {
  user: AuthUserDto;
  tokens: TokenPairDto;
  session: SessionInfoDto;
};

export type InternalRefreshResponse = {
  tokens: TokenPairDto;
  session: SessionInfoDto;
};

export type InternalLogoutResponse = {
  success: boolean;
  revokedSessionIds: string[];
};

export type InternalSetPasswordResponse = {
  success: boolean;
};

export type InternalVerifyResponse = {
  valid: boolean;
  user: AuthUserDto;
  session: SessionInfoDto;
  claims: VerifyClaimsDto;
};

export type DisableUserRequestDto = {
  reason: string;
  revokeSessions?: boolean;
};

export type SetUserRolesRequestDto = {
  roles: string[];
};

export type RevokeSessionsRequestDto = {
  reason?: string;
};

export type EnableUserRequestDto = {
  reason?: string;
};

export type UserDisabledResponseDto = {
  userId: string;
  status: string;
  revokedSessions: number;
};

export type UserEnabledResponseDto = {
  userId: string;
  status: string;
};

export type UserRolesResponseDto = {
  userId: string;
  roles: string[];
  updatedAt: string;
};

export type RevokeSessionsResponseDto = {
  userId: string;
  revokedSessions: number;
};

export type PageInfoDto = {
  nextCursor?: string | null;
  hasNextPage: boolean;
};

export type UserSearchQueryDto = {
  query?: string;
  cursor?: string;
  limit?: number;
};

export type UserSearchResponseDto = {
  items: AuthUserDto[];
  pageInfo: PageInfoDto;
};

export type UserDetailResponseDto = {
  user: AuthUserDto;
};

export type AuditQueryDto = {
  userId?: string;
  action?: string;
  cursor?: string;
  limit?: number;
};

export type AuditLogItemDto = {
  id: string;
  userId?: string | null;
  actorUserId?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditListResponseDto = {
  items: AuditLogItemDto[];
  pageInfo: PageInfoDto;
};

export type UpdatePlayerStatsDto = {
  matchesWon?: string[];
  matchesLost?: string[];
  achievements?: string[];
  weapons?: string[];
  matchParticipants?: string[];
  xp?: number;
  level?: number;
  wins?: number;
  losses?: number;
  kills?: number;
  deaths?: number;
  damageDealt?: number;
  damageTaken?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PlayerStatsDto = Record<string, unknown>;
