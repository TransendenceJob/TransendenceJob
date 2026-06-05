export type AccessTokenClaims = {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
  iss: string;
  aud?: string | string[];
  iat: number;
  exp: number;
};
