import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  requestId?: string;
  actorId?: string; // optional for later
}

// This creates a global storage container for your app.
export const auditContext = new AsyncLocalStorage<AuditContext>();

/* AsyncLocalStorage is a tools in node js that you can store data in it and then
	later, in your app, you can use from this data without reference

*/