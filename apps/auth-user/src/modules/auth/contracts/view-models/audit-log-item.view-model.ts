import { AuditActionDto } from '../enums/audit-action.enum';

export class AuditLogItemViewModel {
  id!: string;
  userId?: string | null;
  actorUserId?: string | null;
  action!: AuditActionDto;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt!: string;
}
