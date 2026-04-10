import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionRepository } from '../../persistence/repositories/session.repository';
import { UserRepository } from '../../persistence/repositories/user.repository';
import { VerifyResponseDto } from '../contracts/dto/verify-response.dto';
import { AuthContractMapper } from '../contracts/mappers/auth-contract.mapper';
import { AccessTokenService } from '../tokens/access-token.service';

type VerifiedSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: Date;
    disabledAt: Date | null;
  };
};

type UserWithAuthProviders = {
  authProviders: Array<{
    provider: string;
    providerUserId: string;
  }>;
};

export type VerifyInput = {
  token: string;
  audience?: string;
};

@Injectable()
export class AuthVerifyService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async verify(input: VerifyInput): Promise<VerifyResponseDto> {
    const claims = await this.accessTokens.verifyAccessToken(input.token);

    if (input.audience && claims.aud !== input.audience) {
      throw new UnauthorizedException('Invalid access token audience');
    }

    const session = (await this.sessions.findActiveByIdWithUser(
      claims.sessionId,
    )) as VerifiedSession | null;

    if (!session) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (session.userId !== claims.sub || session.user.email !== claims.email) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (session.user.status !== 'ACTIVE' || session.user.disabledAt) {
      throw new ForbiddenException('User is disabled');
    }

    const [roles, userWithAuthProviders] = await Promise.all([
      this.users.getRoleNamesForUser(session.userId),
      this.users.findByIdWithAuthProviders(session.userId),
    ]);

    const authProviderUser =
      userWithAuthProviders as UserWithAuthProviders | null;

    if (!authProviderUser) {
      throw new UnauthorizedException('Invalid access token');
    }

    const verifyResponseInput = {
      user: {
        id: session.user.id,
        email: session.user.email,
        status: session.user.status,
        createdAt: session.user.createdAt,
        roles: roles.map((roleName) => ({
          role: {
            name: roleName,
          },
        })),
        authProviders: authProviderUser.authProviders,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
      },
      claims: {
        sub: claims.sub,
        iat: claims.iat,
        exp: claims.exp,
        iss: claims.iss,
        aud: claims.aud,
      },
    } satisfies Parameters<typeof AuthContractMapper.toVerifyResponse>[0];

    return AuthContractMapper.toVerifyResponse(verifyResponseInput);
  }
}
