import { AuthDirectoryService } from './auth-directory.service';

describe('AuthDirectoryService', () => {
  const config = {
    auth: {
      serviceUrl: 'http://auth_service:3000',
    },
    app: {
      serviceName: 'social-service',
    },
  };

  let fetchMock: jest.SpyInstance;
  let service: AuthDirectoryService;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        items: [{ id: 'user-1', email: 'stefan@example.com' }],
        pageInfo: { nextCursor: null, hasNextPage: false },
      }),
    } as never);
    service = new AuthDirectoryService(config as never);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('calls auth directory with bearer token and social service name', async () => {
    const response = await service.searchUsers(
      {
        query: 'stefan',
        limit: 10,
      },
      'access-token',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        'http://auth_service:3000/internal/auth/users/search?query=stefan&limit=10',
      ),
      {
        method: 'GET',
        headers: {
          authorization: 'Bearer access-token',
          'x-service-name': 'social-service',
        },
      },
    );
    expect(response.items?.[0]?.email).toBe('stefan@example.com');
  });
});
