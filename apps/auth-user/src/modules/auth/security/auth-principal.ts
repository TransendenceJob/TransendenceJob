import type { AccessTokenClaims } from '../tokens/token-contracts';

export type AuthRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SERVICE';

export type AuthPrincipal = {
  token: string;
  claims: AccessTokenClaims;
  roleSet: Set<string>;
};
