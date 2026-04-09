import { Inject, Injectable } from '@nestjs/common';
import {
  type AuthProvider,
  type AuthProviderType,
  type Prisma,
} from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

type ProviderWithUser = Prisma.AuthProviderGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class AuthProviderRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  findByProviderIdentity(
    provider: AuthProviderType,
    providerUserId: string,
    db?: DbClient,
  ): Promise<AuthProvider | null> {
    return this.db(db).authProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });
  }

  findUserByProviderIdentity(
    provider: AuthProviderType,
    providerUserId: string,
    db?: DbClient,
  ): Promise<ProviderWithUser | null> {
    return this.db(db).authProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  findByUserId(userId: string, db?: DbClient): Promise<AuthProvider[]> {
    return this.db(db).authProvider.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  linkProviderToUser(
    data: {
      userId: string;
      provider: AuthProviderType;
      providerUserId: string;
    },
    db?: DbClient,
  ): Promise<AuthProvider> {
    return this.db(db).authProvider.upsert({
      where: {
        provider_providerUserId: {
          provider: data.provider,
          providerUserId: data.providerUserId,
        },
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerUserId: data.providerUserId,
      },
      update: {
        userId: data.userId,
      },
    });
  }

  unlinkProvider(
    userId: string,
    provider: AuthProviderType,
    db?: DbClient,
  ): Promise<{ count: number }> {
    return this.db(db).authProvider.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }

  async existsProviderIdentity(
    provider: AuthProviderType,
    providerUserId: string,
    db?: DbClient,
  ): Promise<boolean> {
    const count = await this.db(db).authProvider.count({
      where: {
        provider,
        providerUserId,
      },
    });

    return count > 0;
  }
}
