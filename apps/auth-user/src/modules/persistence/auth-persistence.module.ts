import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuthProviderRepository } from './repositories/auth-provider.repository';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { PRISMA_DB } from './persistence.tokens';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PRISMA_DB,
      useExisting: PrismaService,
    },
    UserRepository,
    RoleRepository,
    SessionRepository,
    AuthProviderRepository,
    PasswordResetTokenRepository,
    AuditLogRepository,
  ],
  exports: [
    UserRepository,
    RoleRepository,
    SessionRepository,
    AuthProviderRepository,
    PasswordResetTokenRepository,
    AuditLogRepository,
  ],
})
export class AuthPersistenceModule {}
