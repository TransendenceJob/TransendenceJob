import { Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuditExtension } from './audit.prisma-middleware.js';
import { OnModuleInit } from '@nestjs/common';
import { AuditRepository } from '../persistence/repository/audit.repository.js';

@Module({
  providers: [AuditService, AuditRepository],
  imports: [],
})
export class AuditModule implements OnModuleInit {
  constructor(
    private auditService: AuditService,
    private prismaService: PrismaService,
  ) {}

  onModuleInit() {
    this.prismaService.attachAuditMiddleware(this.auditService);
  }
}
