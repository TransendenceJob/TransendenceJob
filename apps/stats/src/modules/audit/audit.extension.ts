import { auditContext } from './audit.context';

export function auditExtension() {
	console.log("AUDIT EXTENSION LOADED");

  return {
    name: 'audit-extension',
    
  };
}
