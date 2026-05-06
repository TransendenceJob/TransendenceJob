import { Inject, Injectable } from '@nestjs/common';
import { type Prisma, type User, type UserStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

export type UserWithAdminRelations = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    authProviders: true;
  };
}>;

type UserWithAuthProviders = Prisma.UserGetPayload<{
  include: { authProviders: true };
}>;

type UserWithSessions = Prisma.UserGetPayload<{
  include: { sessions: true };
}>;

@Injectable()
export class UserRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  findById(userId: string, db?: DbClient): Promise<User | null> {
    return this.db(db).user.findUnique({ where: { id: userId } });
  }

  findByEmail(email: string, db?: DbClient): Promise<User | null> {
    return this.db(db).user.findUnique({ where: { email } });
  }

  findByUsername(username: string, db?: DbClient): Promise<User | null> {
    return this.db(db).user.findUnique({ where: { username } });
  }

  findByEmailWithRoles(
    email: string,
    db?: DbClient,
  ): Promise<UserWithRoles | null> {
    return this.db(db).user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findByIdWithRoles(
    userId: string,
    db?: DbClient,
  ): Promise<UserWithRoles | null> {
    return this.db(db).user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findByIdWithAdminRelations(
    userId: string,
    db?: DbClient,
  ): Promise<UserWithAdminRelations | null> {
    return this.db(db).user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        authProviders: true,
      },
    });
  }

  searchUsers(
    input: {
      query?: string;
      cursor?: string;
      take: number;
    },
    db?: DbClient,
  ): Promise<UserWithAdminRelations[]> {
    const query = input.query?.trim();
    const where = query
      ? this.buildSearchWhere(query)
      : ({} satisfies Prisma.UserWhereInput);

    return this.db(db).user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        authProviders: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: input.take,
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
    });
  }

  findByIdWithAuthProviders(
    userId: string,
    db?: DbClient,
  ): Promise<UserWithAuthProviders | null> {
    return this.db(db).user.findUnique({
      where: { id: userId },
      include: {
        authProviders: true,
      },
    });
  }

  findByIdWithSessions(
    userId: string,
    db?: DbClient,
  ): Promise<UserWithSessions | null> {
    return this.db(db).user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
      },
    });
  }

  createLocalUser(
    data: {
      email: string;
      username?: string | null;
      passwordHash: string;
      status?: UserStatus;
    },
    db?: DbClient,
  ): Promise<User> {
    return this.db(db).user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        status: data.status,
      },
    });
  }

  createOAuthUser(
    data: {
      email: string;
      username?: string | null;
      status?: UserStatus;
    },
    db?: DbClient,
  ): Promise<User> {
    return this.db(db).user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: null,
        status: data.status,
      },
    });
  }

  setPasswordHash(
    userId: string,
    passwordHash: string,
    db?: DbClient,
  ): Promise<User> {
    return this.db(db).user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  updateStatus(
    userId: string,
    status: UserStatus,
    db?: DbClient,
  ): Promise<User> {
    return this.db(db).user.update({
      where: { id: userId },
      data: { status },
    });
  }

  disableUser(
    userId: string,
    disabledAt = new Date(),
    db?: DbClient,
  ): Promise<User> {
    return this.db(db).user.update({
      where: { id: userId },
      data: {
        status: 'DISABLED',
        disabledAt,
      },
    });
  }

  enableUser(userId: string, db?: DbClient): Promise<User> {
    return this.db(db).user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        disabledAt: null,
      },
    });
  }

  touchUpdatedAt(userId: string, db?: DbClient): Promise<User> {
    return this.db(db).user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  async isActive(userId: string, db?: DbClient): Promise<boolean> {
    const user = await this.db(db).user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        disabledAt: true,
      },
    });

    if (!user) {
      return false;
    }

    return user.status === 'ACTIVE' && user.disabledAt === null;
  }

  async getRoleNamesForUser(userId: string, db?: DbClient): Promise<string[]> {
    const user = await this.findByIdWithRoles(userId, db);
    if (!user) {
      return [];
    }

    return user.roles.map((entry) => entry.role.name);
  }

  private buildSearchWhere(query: string): Prisma.UserWhereInput {
    const filters: Prisma.UserWhereInput[] = [
      {
        email: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
    ];

    if (this.isUuid(query)) {
      filters.push({ id: query });
    }

    return { OR: filters };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
