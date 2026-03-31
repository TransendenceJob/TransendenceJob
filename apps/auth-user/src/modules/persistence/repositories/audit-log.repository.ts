import { Inject, Injectable } from '@nestjs/common';
import { type AuditAction, type AuditLog } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

export type AuditLogFilters = {
  userId?: string;
  actorUserId?: string;
  action?: AuditAction;
  createdFrom?: Date;
  createdTo?: Date;
  take?: number;
  skip?: number;
};

@Injectable()
export class AuditLogRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  createEvent(
    data: {
      action: AuditAction;
      userId?: string | null;
      actorUserId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
      metadataJson?: unknown;
    },
    db?: DbClient,
  ): Promise<AuditLog> {
    return this.db(db).auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        actorUserId: data.actorUserId,
        ip: data.ip,
        userAgent: data.userAgent,
        metadataJson: data.metadataJson,
      },
    });
  }

  listByUserId(
    userId: string,
    filters: AuditLogFilters = {},
    db?: DbClient,
  ): Promise<AuditLog[]> {
    return this.searchAuditLogs(
      {
        ...filters,
        userId,
      },
      db,
    );
  }

  listByActorUserId(
    actorUserId: string,
    filters: AuditLogFilters = {},
    db?: DbClient,
  ): Promise<AuditLog[]> {
    return this.searchAuditLogs(
      {
        ...filters,
        actorUserId,
      },
      db,
    );
  }

  listByAction(
    action: AuditAction,
    filters: AuditLogFilters = {},
    db?: DbClient,
  ): Promise<AuditLog[]> {
    return this.searchAuditLogs(
      {
        ...filters,
        action,
      },
      db,
    );
  }

  searchAuditLogs(
    filters: AuditLogFilters = {},
    db?: DbClient,
  ): Promise<AuditLog[]> {
    return this.db(db).auditLog.findMany({
      where: {
        userId: filters.userId,
        actorUserId: filters.actorUserId,
        action: filters.action,
        createdAt: {
          gte: filters.createdFrom,
          lte: filters.createdTo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }
}
