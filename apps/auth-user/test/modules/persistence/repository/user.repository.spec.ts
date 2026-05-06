import { UserRepository } from '../../../../src/modules/persistence/repositories/user.repository';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';

describe('UserRepository', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new UserRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findByEmail queries by unique email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    await repository.findByEmail('user@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('findByEmailWithRoles loads role relation', async () => {
    await repository.findByEmailWithRoles('user@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'user@example.com' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
    );
  });

  it('findByIdWithAdminRelations loads roles and providers', async () => {
    await repository.findByIdWithAdminRelations('u1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        authProviders: true,
      },
    });
  });

  it('searchUsers matches email and username case-insensitively', async () => {
    await repository.searchUsers({ query: 'Stefan', take: 21 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              email: {
                contains: 'Stefan',
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: 'Stefan',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          authProviders: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 21,
      }),
    );
  });

  it('searchUsers includes uuid exact match and cursor pagination', async () => {
    const userId = '842e1132-2258-4b04-b2a2-dee603638c93';

    await repository.searchUsers({
      query: userId,
      cursor: 'd200724c-2856-4319-aefa-b41a73a0a0eb',
      take: 10,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              email: {
                contains: userId,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: userId,
                mode: 'insensitive',
              },
            },
            {
              id: userId,
            },
          ],
        },
        cursor: { id: 'd200724c-2856-4319-aefa-b41a73a0a0eb' },
        skip: 1,
      }),
    );
  });

  it('createLocalUser stores password hash', async () => {
    await repository.createLocalUser({
      email: 'local@example.com',
      passwordHash: 'hashed',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'local@example.com',
        passwordHash: 'hashed',
        status: undefined,
      },
    });
  });

  it('createOAuthUser stores nullable password hash', async () => {
    await repository.createOAuthUser({
      email: 'oauth@example.com',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'oauth@example.com',
        passwordHash: null,
        status: undefined,
      },
    });
  });

  it('disableUser sets status and disabledAt', async () => {
    const disabledAt = new Date('2026-03-31T00:00:00.000Z');
    await repository.disableUser('u1', disabledAt);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        status: 'DISABLED',
        disabledAt,
      },
    });
  });

  it('enableUser reactivates user and clears disabledAt', async () => {
    await repository.enableUser('u1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        status: 'ACTIVE',
        disabledAt: null,
      },
    });
  });

  it('isActive returns false when user missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const active = await repository.isActive('missing');

    expect(active).toBe(false);
  });

  it('isActive returns true for ACTIVE without disabledAt', async () => {
    prisma.user.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      disabledAt: null,
    });

    const active = await repository.isActive('u1');

    expect(active).toBe(true);
  });

  it('getRoleNamesForUser maps role relation to string array', async () => {
    prisma.user.findUnique.mockResolvedValue({
      roles: [{ role: { name: 'USER' } }, { role: { name: 'ADMIN' } }],
    });

    const roles = await repository.getRoleNamesForUser('u1');

    expect(roles).toEqual(['USER', 'ADMIN']);
  });
});
