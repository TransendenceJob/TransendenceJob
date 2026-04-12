import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../persistence/repository/audit.repository';
// import { AuditRepository } from './audit.repository.js';

@Injectable()
export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  async write(entry: any) {
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