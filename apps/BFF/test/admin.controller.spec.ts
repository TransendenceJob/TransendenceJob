import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/modules/auth/admin.controller';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AdminController', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];

  const authServiceMock = {
    searchUsers: jest.fn(),
    getUser: jest.fn(),
    disableUser: jest.fn(),
    enableUser: jest.fn(),
    setUserRoles: jest.fn(),
    revokeUserSessions: jest.fn(),
    listAuditLogs: jest.fn(),
    getPlayerStats: jest.fn(),
    updatePlayerStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterEach(async () => {
    await app.close();
  });

  it('proxies user search with authorization context', async () => {
    authServiceMock.searchUsers.mockResolvedValue({
      items: [],
      pageInfo: {
        nextCursor: null,
        hasNextPage: false,
      },
    });

    await request(server)
      .get('/admin/users')
      .query({ query: 'stefan', limit: '10' })
      .set('authorization', 'Bearer token')
      .set('x-request-id', 'req-1')
      .expect(200);

    expect(authServiceMock.searchUsers).toHaveBeenCalledWith(
      { query: 'stefan', limit: '10' },
      {
        requestId: 'req-1',
        authorization: 'Bearer token',
      },
    );
  });

  it('proxies enable user requests', async () => {
    authServiceMock.enableUser.mockResolvedValue({
      userId: 'user-1',
      status: 'active',
    });

    await request(server)
      .post('/admin/users/user-1/enable')
      .set('authorization', 'Bearer token')
      .send({ reason: 'appeal approved' })
      .expect(200);

    expect(authServiceMock.enableUser).toHaveBeenCalledWith(
      'user-1',
      { reason: 'appeal approved' },
      {
        requestId: undefined,
        authorization: 'Bearer token',
      },
    );
  });

  it('proxies admin stats updates through the BFF', async () => {
    authServiceMock.updatePlayerStats.mockResolvedValue({
      userId: 'user-1',
      wins: 12,
    });

    await request(server)
      .put('/admin/users/user-1/stats')
      .set('authorization', 'Bearer token')
      .send({ wins: 12 })
      .expect(200);

    expect(authServiceMock.updatePlayerStats).toHaveBeenCalledWith(
      'user-1',
      { wins: 12 },
      {
        requestId: undefined,
        authorization: 'Bearer token',
      },
    );
  });

  it('rejects missing authorization', async () => {
    await request(server).get('/admin/users').expect(401);
  });
});
