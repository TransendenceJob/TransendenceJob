import { SessionRepository } from '../../../../src/modules/persistence/repositories/session.repository';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';

describe('SessionRepository', () => {
  const prisma = {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new SessionRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createSession persists metadata and expiry', async () => {
    const expiresAt = new Date('2026-04-07T00:00:00.000Z');

    await repository.createSession({
      userId: 'u1',
      refreshTokenHash: 'hash',
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
      expiresAt,
    });

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        refreshTokenHash: 'hash',
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
        expiresAt,
      },
    });
  });

  it('findActiveById filters revoked and expired sessions', async () => {
    await repository.findActiveById('s1');

    expect(prisma.session.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 's1',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        }),
      }),
    );
  });

  it('findActiveSessionsByUserId returns newest first', async () => {
    await repository.findActiveSessionsByUserId('u1');

    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('updateRefreshTokenHash updates hash and optional expiresAt', async () => {
    const expiresAt = new Date('2026-04-08T00:00:00.000Z');
    await repository.updateRefreshTokenHash('s1', 'next-hash', expiresAt);

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        refreshTokenHash: 'next-hash',
        expiresAt,
      },
    });
  });

  it('revokeAllSessionsForUser only revokes active non-revoked sessions', async () => {
    const revokedAt = new Date('2026-04-09T12:00:00.000Z');
    await repository.revokeAllSessionsForUser('u1', revokedAt);

    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u1',
          revokedAt: null,
          expiresAt: { gt: revokedAt },
        },
      }),
    );
  });

  it('isSessionActive returns boolean from active query', async () => {
    prisma.session.findFirst.mockResolvedValueOnce(null);
    prisma.session.findFirst.mockResolvedValueOnce({ id: 's1' });

    await expect(repository.isSessionActive('missing')).resolves.toBe(false);
    await expect(repository.isSessionActive('s1')).resolves.toBe(true);
  });
});
