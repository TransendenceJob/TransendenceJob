import { UnauthorizedException } from '@nestjs/common';
import { BearerTokenMiddleware } from '../../../../src/modules/common/middleware/bearer-token.middleware';

describe('BearerTokenMiddleware', () => {
  const middleware = new BearerTokenMiddleware();

  it('stores bearer token on request when header is valid', () => {
    const req = {
      headers: {
        authorization: 'Bearer token-value',
      },
    } as any;
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(req.bearerToken).toBe('token-value');
    expect(next).toHaveBeenCalled();
  });

  it('keeps bearerToken undefined when header is missing', () => {
    const req = {
      headers: {},
    } as any;
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(req.bearerToken).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('throws UnauthorizedException on malformed authorization header', () => {
    const req = {
      headers: {
        authorization: 'Basic token-value',
      },
    } as any;

    expect(() => middleware.use(req, {} as any, jest.fn())).toThrow(
      UnauthorizedException,
    );
  });
});