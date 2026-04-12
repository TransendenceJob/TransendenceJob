import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  async create(entry: any) {
    return this.prisma.auditLog.create({
      data: entry,
    });
  }

  // find the old audit for update and delete
 async findById(model: string, where: Record<string, any>) {
  const delegate = (this.prisma as any)[model];

  if (!delegate) return null;

  return delegate.findUnique({ where });
}
}
