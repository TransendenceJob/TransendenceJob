import { SetMetadata } from '@nestjs/common';
import type { AuthRole } from '../auth-principal';

export const ROLES_KEY = 'auth:roles';
export const ALLOW_TRUSTED_SERVICE_KEY = 'auth:allowTrustedService';

export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
export const AllowTrustedService = () =>
  SetMetadata(ALLOW_TRUSTED_SERVICE_KEY, true);
