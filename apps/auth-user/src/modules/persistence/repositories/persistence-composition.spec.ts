import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
import { AuditLogRepository } from './audit-log.repository';
import { UserRepository } from './user.repository';
import { type PrismaService } from '../../prisma/prisma.service';

describe('Persistence composition (integration-style with transaction client)', () => {
  const tx = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    role: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userRole: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const prisma = {
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const userRepository = new UserRepository(prisma);
  const roleRepository = new RoleRepository(prisma);
  const sessionRepository = new SessionRepository(prisma);
  const auditLogRepository = new AuditLogRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();

    tx.user.create.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
    tx.role.upsert.mockResolvedValue({ id: 'r1', name: 'USER' });
    tx.userRole.upsert.mockResolvedValue({ userId: 'u1', roleId: 'r1' });
    tx.session.create.mockResolvedValue({ id: 's1' });
    tx.auditLog.create.mockResolvedValue({ id: 'a1' });

    prisma.$transaction = jest.fn(
      async (callback: (client: PrismaService) => Promise<void>) => {
        await callback(tx);
      },
    );
  });

  it('supports multi-entity register/login composition using one transaction client', async () => {
    await prisma.$transaction(async (db) => {
      const user = await userRepository.createLocalUser(
        {
          email: 'user@example.com',
          passwordHash: 'hash',
        },
        db,
      );

      await roleRepository.assignRoleToUser(user.id, 'USER', db);

      await sessionRepository.createSession(
        {
          userId: user.id,
          refreshTokenHash: 'refresh-hash',
          expiresAt: new Date('2026-04-07T00:00:00.000Z'),
        },
        db,
      );

      await auditLogRepository.createEvent(
        {
          action: 'LOGIN_SUCCEEDED',
          userId: user.id,
          actorUserId: user.id,
          metadataJson: { flow: 'register+login' },
        },
        db,
      );
    });

    expect(tx.user.create).toHaveBeenCalledTimes(1);
    expect(tx.role.upsert).toHaveBeenCalledTimes(1);
    expect(tx.userRole.upsert).toHaveBeenCalledTimes(1);
    expect(tx.session.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
