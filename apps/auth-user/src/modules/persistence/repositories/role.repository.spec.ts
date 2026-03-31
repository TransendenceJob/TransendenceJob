import { RoleRepository } from './role.repository';
import { type PrismaService } from '../../prisma/prisma.service';

describe('RoleRepository', () => {
  const prisma = {
    role: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    userRole: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new RoleRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ensureRoleExists upserts role by name', async () => {
    await repository.ensureRoleExists('USER');

    expect(prisma.role.upsert).toHaveBeenCalledWith({
      where: { name: 'USER' },
      create: { name: 'USER' },
      update: {},
    });
  });

  it('assignRoleToUser uses composite key upsert', async () => {
    prisma.role.upsert.mockResolvedValue({ id: 'r1', name: 'USER' });

    await repository.assignRoleToUser('u1', 'USER');

    expect(prisma.userRole.upsert).toHaveBeenCalledWith({
      where: {
        userId_roleId: {
          userId: 'u1',
          roleId: 'r1',
        },
      },
      create: {
        userId: 'u1',
        roleId: 'r1',
      },
      update: {},
    });
  });

  it('removeRoleFromUser is idempotent when role missing', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    await repository.removeRoleFromUser('u1', 'UNKNOWN');

    expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
  });

  it('replaceUserRoles de-duplicates names and recreates assignments', async () => {
    prisma.role.upsert
      .mockResolvedValueOnce({ id: 'r1', name: 'USER' })
      .mockResolvedValueOnce({ id: 'r2', name: 'ADMIN' });

    const result = await repository.replaceUserRoles('u1', [
      'USER',
      'ADMIN',
      'USER',
    ]);

    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'u1', roleId: 'r1' },
        { userId: 'u1', roleId: 'r2' },
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual(['USER', 'ADMIN']);
  });

  it('getUserRoles returns role names only', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'USER' } },
      { role: { name: 'ADMIN' } },
    ]);

    const roles = await repository.getUserRoles('u1');

    expect(roles).toEqual(['USER', 'ADMIN']);
  });
});
