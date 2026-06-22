import type { AccessTokenClaims } from '../modules/auth/tokens/token-contracts';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      serviceName?: string;
      bearerToken?: string;
      authPrincipal?: {
        token: string;
        claims: AccessTokenClaims;
        roleSet: Set<string>;
      };
    }
  }
}

export {};
