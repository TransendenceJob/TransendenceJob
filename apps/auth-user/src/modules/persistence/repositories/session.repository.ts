import { Inject, Injectable } from '@nestjs/common';
import { type Prisma, type Session } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

type SessionWithUser = Prisma.SessionGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class SessionRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  createSession(
    data: {
      userId: string;
      refreshTokenHash: string;
      userAgent?: string;
      ipAddress?: string;
      expiresAt: Date;
    },
    db?: DbClient,
  ): Promise<Session> {
    return this.db(db).session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
      },
    });
  }

  findById(sessionId: string, db?: DbClient): Promise<Session | null> {
    return this.db(db).session.findUnique({
      where: { id: sessionId },
    });
  }

  findActiveById(sessionId: string, db?: DbClient): Promise<Session | null> {
    return this.db(db).session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  findActiveByIdWithUser(
    sessionId: string,
    db?: DbClient,
  ): Promise<SessionWithUser | null> {
    return this.db(db).session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  findActiveByRefreshTokenHashWithUser(
    refreshTokenHash: string,
    db?: DbClient,
  ): Promise<SessionWithUser | null> {
    return this.db(db).session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  findActiveSessionsByUserId(
    userId: string,
    db?: DbClient,
  ): Promise<Session[]> {
    return this.db(db).session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  updateRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
    expiresAt?: Date,
    db?: DbClient,
  ): Promise<Session> {
    return this.db(db).session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  updateRefreshTokenHashIfCurrent(
    sessionId: string,
    expectedRefreshTokenHash: string,
    refreshTokenHash: string,
    expiresAt: Date,
    db?: DbClient,
  ): Promise<{ count: number }> {
    return this.db(db).session.updateMany({
      where: {
        id: sessionId,
        refreshTokenHash: expectedRefreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  revokeSession(
    sessionId: string,
    revokedAt = new Date(),
    db?: DbClient,
  ): Promise<Session> {
    return this.db(db).session.update({
      where: { id: sessionId },
      data: {
        revokedAt,
      },
    });
  }

  revokeAllSessionsForUser(
    userId: string,
    revokedAt = new Date(),
    db?: DbClient,
  ): Promise<{ count: number }> {
    return this.db(db).session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }

  deleteExpiredSessions(
    before: Date,
    db?: DbClient,
  ): Promise<{ count: number }> {
    return this.db(db).session.deleteMany({
      where: {
        expiresAt: {
          lt: before,
        },
      },
    });
  }

  async isSessionActive(sessionId: string, db?: DbClient): Promise<boolean> {
    const session = await this.findActiveById(sessionId, db);
    return Boolean(session);
  }
}
