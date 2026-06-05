import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../../src/modules/auth/security/guards/roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows when required role is present', () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(false);

    const request = {
      authPrincipal: {
        roleSet: new Set(['ADMIN']),
      },
      serviceName: 'bff',
    } as any;

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows trusted service actor when configured', () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(true);

    const request = {
      authPrincipal: {
        roleSet: new Set(['SERVICE']),
      },
      serviceName: 'auth-service',
    } as any;

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects missing required role', () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(false);

    const request = {
      authPrincipal: {
        roleSet: new Set(['USER']),
      },
      serviceName: 'bff',
    } as any;

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
