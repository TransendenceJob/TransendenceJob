export interface AuditLogEntry {
  requestId?: string;
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: any;
  after?: any;
  source?: string;
}