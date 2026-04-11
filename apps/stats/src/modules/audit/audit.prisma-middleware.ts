import type { Prisma } from '@prisma/client';
import { auditContext } from './audit.context.js';
import { AuditService } from './audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createAuditPrismaMiddleware(
  auditService: AuditService,
  prisma: PrismaService,
) {
  return async (params: Prisma.MiddlewareParams, next) => {
    const writeOps = ['create', 'update', 'delete'];

    if (!writeOps.includes(params.action)) {
      return next(params);
    }

    const ctx = auditContext.getStore() || {};
    const requestId = ctx.requestId;
    const actorId = ctx.actorId;

    let before = null;

    if (params.action !== 'create') {
      before = await prisma[params.model].findUnique({
        where: params.args.where,
      });
    }

    const result = await next(params);

    await auditService.write({
      requestId,
      actorId,
      action: params.action,
      entityType: params.model,
      entityId: result?.id?.toString(),
      before,
      after: result,
      source: 'stats_service',
    });

    return result;
  };
}
