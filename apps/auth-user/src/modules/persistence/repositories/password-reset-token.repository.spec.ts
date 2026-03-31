import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { type PrismaService } from '../../prisma/prisma.service';

describe('PasswordResetTokenRepository', () => {
  const prisma = {
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new PasswordResetTokenRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createToken stores hash only with expiry', async () => {
    const expiresAt = new Date('2026-04-01T00:00:00.000Z');
    await repository.createToken({
      userId: 'u1',
      tokenHash: 'hash',
      expiresAt,
    });

    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        tokenHash: 'hash',
        expiresAt,
      },
    });
  });

  it('findActiveByTokenHash filters used and expired tokens', async () => {
    await repository.findActiveByTokenHash('hash');

    expect(prisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: 'hash',
        usedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
    });
  });

  it('markUsed sets used timestamp', async () => {
    const usedAt = new Date('2026-03-31T00:00:00.000Z');
    await repository.markUsed('t1', usedAt);

    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { usedAt },
    });
  });

  it('invalidateOutstandingTokensForUser updates only active tokens', async () => {
    await repository.invalidateOutstandingTokensForUser('u1');

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u1',
          usedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      }),
    );
  });

  it('deleteExpiredTokens deletes by before date', async () => {
    const before = new Date('2026-03-31T00:00:00.000Z');
    await repository.deleteExpiredTokens(before);

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lt: before,
        },
      },
    });
  });
});
