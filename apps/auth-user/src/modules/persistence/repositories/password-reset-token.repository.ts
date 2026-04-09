import { Inject, Injectable } from '@nestjs/common';
import { type PasswordResetToken } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  createToken(
    data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    db?: DbClient,
  ): Promise<PasswordResetToken> {
    return this.db(db).passwordResetToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  findByTokenHash(
    tokenHash: string,
    db?: DbClient,
  ): Promise<PasswordResetToken | null> {
    return this.db(db).passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  findActiveByTokenHash(
    tokenHash: string,
    db?: DbClient,
  ): Promise<PasswordResetToken | null> {
    return this.db(db).passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  markUsed(
    tokenId: string,
    usedAt = new Date(),
    db?: DbClient,
  ): Promise<PasswordResetToken> {
    return this.db(db).passwordResetToken.update({
      where: { id: tokenId },
      data: {
        usedAt,
      },
    });
  }

  invalidateOutstandingTokensForUser(
    userId: string,
    usedAt = new Date(),
    db?: DbClient,
  ): Promise<{ count: number }> {
    return this.db(db).passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt,
      },
    });
  }

  deleteExpiredTokens(before: Date, db?: DbClient): Promise<{ count: number }> {
    return this.db(db).passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: before,
        },
      },
    });
  }
}
