import { auditContext } from './audit.context.js';
import { AuditService } from './audit.service.js';
// import { PrismaService } from '../../prisma/prisma.service.js';

import { PrismaClient } from '@prisma/client';

export function createAuditExtension(auditService: AuditService) {
  return (client: PrismaClient) =>
    client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const writeOps = ['create', 'update', 'delete'];

              if (model === 'AuditLog') {
                return query(args);
              }
            if (!writeOps.includes(operation)) {
              return query(args);
            }

            
            const ctx = auditContext.getStore() || {};
            const { requestId, actorId } = ctx;

            let before = null;

            if (operation !== 'create' && 'where' in args) {
              before = await auditService.findById(model, (args as any).where);
            }
          

            const result = await query(args);

            await auditService.write({
              requestId,
              actorId,
              action: operation,
              entityType: model,
              entityId: (result as any)?.id?.toString(),
              before,
              after: result,
              source: 'stats_service',
            });

            return result;
          },
        },
      },
    });
}

