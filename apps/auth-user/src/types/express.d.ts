declare namespace Express {
  interface AccessTokenClaims {
    sub: string;
    email: string;
    roles: string[];
    sessionId: string;
    iss: string;
    aud: string;
    iat: number;
    exp: number;
  }

  interface AuthPrincipal {
    token: string;
    claims: AccessTokenClaims;
    roleSet: Set<string>;
  }

  interface Request {
    requestId?: string;
    serviceName?: string;
    bearerToken?: string;
    userAgent?: string | null;
    authPrincipal?: AuthPrincipal;
  }
}
