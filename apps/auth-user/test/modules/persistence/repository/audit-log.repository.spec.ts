import { AuditLogRepository } from '../../../../src/modules/persistence/repositories/audit-log.repository';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';

describe('AuditLogRepository', () => {
  const prisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new AuditLogRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createEvent persists nullable actor/target and metadata', async () => {
    await repository.createEvent({
      action: 'LOGIN_FAILED',
      userId: null,
      actorUserId: null,
      ip: '127.0.0.1',
      userAgent: 'jest',
      metadataJson: { reason: 'bad_credentials' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'LOGIN_FAILED',
        userId: null,
        actorUserId: null,
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadataJson: { reason: 'bad_credentials' },
      },
    });
  });

  it('listByUserId delegates to filtered search', async () => {
    await repository.listByUserId('u1', { take: 20 });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1' }),
        take: 20,
      }),
    );
  });

  it('listByActorUserId applies actor filter', async () => {
    await repository.listByActorUserId('admin-1', { skip: 10 });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ actorUserId: 'admin-1' }),
        skip: 10,
      }),
    );
  });

  it('listByAction applies action filter', async () => {
    await repository.listByAction('ROLE_CHANGED', { take: 5 });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: 'ROLE_CHANGED' }),
        take: 5,
      }),
    );
  });

  it('searchAuditLogs applies all supported filters and ordering', async () => {
    const createdFrom = new Date('2026-03-01T00:00:00.000Z');
    const createdTo = new Date('2026-03-31T23:59:59.999Z');

    await repository.searchAuditLogs({
      userId: 'u1',
      actorUserId: 'admin-1',
      action: 'USER_DISABLED',
      createdFrom,
      createdTo,
      cursor: 'audit-123',
      take: 50,
      skip: 0,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        actorUserId: 'admin-1',
        action: 'USER_DISABLED',
        createdAt: {
          gte: createdFrom,
          lte: createdTo,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      cursor: {
        id: 'audit-123',
      },
      take: 50,
      skip: 1,
    });
  });

  it('searchAuditLogs supports action IN filtering', async () => {
    await repository.searchAuditLogs({
      action: ['LOGIN_SUCCEEDED', 'LOGIN_FAILED'],
      take: 20,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: {
            in: ['LOGIN_SUCCEEDED', 'LOGIN_FAILED'],
          },
        }),
      }),
    );
  });
});
