import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GoogleExchangeRequestDto } from '../../../../src/modules/auth/contracts/dto/google-exchange-request.dto';
import { LogoutRequestDto } from '../../../../src/modules/auth/contracts/dto/logout-request.dto';
import { RegisterRequestDto } from '../../../../src/modules/auth/contracts/dto/register-request.dto';
import { SetUserRolesRequestDto } from '../../../../src/modules/auth/contracts/dto/set-user-roles-request.dto';
import { VerifyQueryDto } from '../../../../src/modules/auth/contracts/dto/verify-query.dto';

describe('Auth Contract DTOs', () => {
  it('accepts a valid register request', () => {
    const dto = plainToInstance(RegisterRequestDto, {
      email: 'stefan@example.com',
      password: 'StrongPassword123!',
      displayName: 'Stefan',
      username: 'theochiper',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts logout request with default logoutAll=false', () => {
    const dto = plainToInstance(LogoutRequestDto, {
      refreshToken: 'rt_opaque_token_value',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.logoutAll).toBe(false);
  });

  it('validates google exchange using authorization code flow', () => {
    const dto = plainToInstance(GoogleExchangeRequestDto, {
      provider: 'google',
      authorizationCode: '4/0AQSTgQ...',
      redirectUri: 'https://example.com/auth/google/callback',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts localhost callback redirect URI for google exchange', () => {
    const dto = plainToInstance(GoogleExchangeRequestDto, {
      provider: 'google',
      authorizationCode: '4/0AQSTgQ...',
      redirectUri: 'http://localhost:3000/auth/google/callback',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('validates google exchange using id token flow', () => {
    const dto = plainToInstance(GoogleExchangeRequestDto, {
      provider: 'google',
      idToken: 'id_token_value',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects google exchange when no flow payload is provided', () => {
    const dto = plainToInstance(GoogleExchangeRequestDto, {
      provider: 'google',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects user roles not present in OpenAPI enum values', () => {
    const dto = plainToInstance(SetUserRolesRequestDto, {
      roles: ['ADMIN'],
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts verify query with audience', () => {
    const dto = plainToInstance(VerifyQueryDto, {
      audience: 'transcendence-internal',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });
});
