import { AuditActionDto } from '../../../../src/modules/auth/contracts/enums/audit-action.enum';
import { UserRoleDto } from '../../../../src/modules/auth/contracts/enums/user-role.enum';
import { UserStatusDto } from '../../../../src/modules/auth/contracts/enums/user-status.enum';
import { AuthContractMapper } from '../../../../src/modules/auth/contracts/mappers/auth-contrat.mapper';

describe('AuthContractMapper', () => {
  const userEntity = {
    id: 'usr_123',
    email: 'stefan@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    roles: [{ role: { name: 'admin' } }, { role: { name: 'user' } }],
    authProviders: [{ provider: 'GOOGLE', providerUserId: 'google_abc123' }],
  };

  it('maps user entity to user auth view model', () => {
    const result = AuthContractMapper.toUserAuthView(userEntity);

    expect(result.id).toBe('usr_123');
    expect(result.status).toBe(UserStatusDto.ACTIVE);
    expect(result.roles).toEqual([UserRoleDto.ADMIN, UserRoleDto.USER]);
    expect(result.providers).toEqual([
      {
        name: 'google',
        providerUserId: 'google_abc123',
      },
    ]);
  });

  it('builds auth success response from user, session, and tokens', () => {
    const response = AuthContractMapper.toAuthSuccessResponse({
      user: userEntity,
      session: {
        id: 'sess_456',
        expiresAt: new Date('2026-03-02T10:00:00.000Z'),
        revokedAt: null,
      },
      tokens: {
        accessToken: 'access_token_value',
        refreshToken: 'refresh_token_value',
        expiresIn: 900,
      },
    });

    expect(response.session.id).toBe('sess_456');
    expect(response.tokens.expiresIn).toBe(900);
    expect(response.tokens.tokenType).toBe('Bearer');
  });

  it('maps audit logs and pagination to AuditListResponse', () => {
    const response = AuthContractMapper.toAuditListResponse({
      logs: [
        {
          id: 'audit_01',
          userId: 'usr_123',
          actorUserId: null,
          action: 'LOGIN_SUCCEEDED',
          ip: '10.0.0.15',
          userAgent: 'Mozilla/5.0',
          metadataJson: { source: 'bff' },
          createdAt: new Date('2026-03-10T12:00:00.000Z'),
        },
      ],
      nextCursor: 'audit_02',
    });

    expect(response.items).toHaveLength(1);
    expect(response.items[0].action).toBe(AuditActionDto.LOGIN_SUCCESS);
    expect(response.pageInfo.hasNextPage).toBe(true);
    expect(response.pageInfo.nextCursor).toBe('audit_02');
  });
});
