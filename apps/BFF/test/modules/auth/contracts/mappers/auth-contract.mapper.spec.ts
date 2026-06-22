import { AuthContractMapper } from '../../../../../src/modules/auth/contracts/mappers/auth-contract.mapper';

describe('AuthContractMapper', () => {
  it('maps auth success with explicit success flag', () => {
    const output = AuthContractMapper.toAuthSuccess({
      user: { id: 'u1', email: 'a@b.com', status: 'ACTIVE' },
      tokens: {
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      session: { id: 's1', expiresAt: '2030-01-01T00:00:00.000Z' },
    });

    expect(output.success).toBe(true);
    expect(output.user.id).toBe('u1');
    expect(output.tokens.accessToken).toBe('a');
  });

  it('maps verify response with explicit success flag', () => {
    const output = AuthContractMapper.toVerifyResponse({
      valid: true,
      user: { id: 'u1', email: 'a@b.com', status: 'ACTIVE' },
      session: { id: 's1', expiresAt: '2030-01-01T00:00:00.000Z' },
      claims: {
        sub: 'u1',
        iat: 1,
        exp: 2,
        iss: 'auth_service',
      },
    });

    expect(output.success).toBe(true);
    expect(output.valid).toBe(true);
    expect(output.claims.sub).toBe('u1');
  });
});
