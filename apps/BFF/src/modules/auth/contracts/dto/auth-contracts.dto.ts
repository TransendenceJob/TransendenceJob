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

export type InternalVerifyResponse = {
  valid: boolean;
  user: AuthUserDto;
  session: SessionInfoDto;
  claims: VerifyClaimsDto;
};
