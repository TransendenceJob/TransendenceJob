export type AccessTokenClaims = {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

export type AccessTokenPayloadInput = {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
};

export type RefreshTokenPair = {
  refreshToken: string;
  refreshTokenHash: string;
  expiresAt: Date;
};
