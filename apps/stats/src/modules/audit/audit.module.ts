import { Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { createAuditPrismaMiddleware } from './audit.prisma-middleware.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [
    PrismaService,
    AuditService,
    {
      provide: 'PRISMA_AUDIT_MIDDLEWARE',
      inject: [AuditService, PrismaService],
      useFactory: (auditService: AuditService, prisma: PrismaService) => {
        return createAuditPrismaMiddleware(auditService, prisma);
      },
    },
  ],
})

export class AuditModule {}
