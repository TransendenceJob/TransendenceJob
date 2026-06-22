import { AuthProviderRepository } from '../../../../src/modules/persistence/repositories/auth-provider.repository';
import { type PrismaService } from '../../../../src/modules/prisma/prisma.service';

describe('AuthProviderRepository', () => {
  const prisma = {
    authProvider: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new AuthProviderRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findByProviderIdentity uses compound unique key', async () => {
    await repository.findByProviderIdentity('GOOGLE', 'google-uid');

    expect(prisma.authProvider.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerUserId: {
          provider: 'GOOGLE',
          providerUserId: 'google-uid',
        },
      },
    });
  });

  it('findUserByProviderIdentity includes user relation', async () => {
    await repository.findUserByProviderIdentity('GOOGLE', 'google-uid');

    expect(prisma.authProvider.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { user: true },
      }),
    );
  });

  it('linkProviderToUser upserts linkage to avoid duplicates', async () => {
    await repository.linkProviderToUser({
      userId: 'u1',
      provider: 'GOOGLE',
      providerUserId: 'google-uid',
    });

    expect(prisma.authProvider.upsert).toHaveBeenCalledWith({
      where: {
        provider_providerUserId: {
          provider: 'GOOGLE',
          providerUserId: 'google-uid',
        },
      },
      create: {
        userId: 'u1',
        provider: 'GOOGLE',
        providerUserId: 'google-uid',
      },
      update: {},
    });
  });

  it('unlinkProvider deletes by userId and provider', async () => {
    await repository.unlinkProvider('u1', 'GOOGLE');

    expect(prisma.authProvider.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        provider: 'GOOGLE',
      },
    });
  });

  it('existsProviderIdentity returns boolean from count', async () => {
    prisma.authProvider.count.mockResolvedValueOnce(0);
    prisma.authProvider.count.mockResolvedValueOnce(1);

    await expect(
      repository.existsProviderIdentity('GOOGLE', 'missing'),
    ).resolves.toBe(false);
    await expect(
      repository.existsProviderIdentity('GOOGLE', 'existing'),
    ).resolves.toBe(true);
  });
});
