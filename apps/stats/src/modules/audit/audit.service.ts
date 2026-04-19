import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../persistence/repository/audit.repository';
import { AuditLogEntry } from './audit.types';
// import { AuditRepository } from './audit.repository.js';

@Injectable()
export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  // write into db 
  async write(entry: AuditLogEntry) {
    return this.auditRepository.create(entry);
  }
  
  async findById(model: string, where: Record<string, any>) {
    return this.auditRepository.findById(model, where);
  }
}

// before = await auditService.findById(
//   params.model,
//   params.args.where
// );