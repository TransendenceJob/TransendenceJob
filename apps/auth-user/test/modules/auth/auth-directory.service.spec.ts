import { AuthDirectoryService } from '../../../src/modules/auth/services/auth-directory.service';

describe('AuthDirectoryService', () => {
  const users = {
    searchActiveUsers: jest.fn(),
  };

  const service = new AuthDirectoryService(users as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches active users and maps directory results', async () => {
    users.searchActiveUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'stefan@example.com',
        username: 'stefan',
        status: 'ACTIVE',
        createdAt: new Date('2026-06-04T00:00:00.000Z'),
        roles: [{ role: { name: 'USER' } }],
        authProviders: [],
      },
      {
        id: 'user-2',
        email: 'next@example.com',
        username: 'next',
        status: 'ACTIVE',
        createdAt: new Date('2026-06-04T00:00:00.000Z'),
        roles: [{ role: { name: 'USER' } }],
        authProviders: [],
      },
    ]);

    const response = await service.searchUsers({
      query: 'stefan',
      limit: 1,
    });

    expect(users.searchActiveUsers).toHaveBeenCalledWith({
      query: 'stefan',
      cursor: undefined,
      take: 2,
    });
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toMatchObject({
      id: 'user-1',
      email: 'stefan@example.com',
      username: 'stefan',
      status: 'active',
    });
    expect(response.pageInfo).toEqual({
      nextCursor: 'user-1',
      hasNextPage: true,
    });
  });
});
