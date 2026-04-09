import { Inject, Injectable } from '@nestjs/common';
import { type Role, type UserRole } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { type DbClient } from './repository.types';
import { PRISMA_DB } from '../persistence.tokens';

@Injectable()
export class RoleRepository {
  constructor(@Inject(PRISMA_DB) private readonly prisma: PrismaService) {}

  private db(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  findByName(name: string, db?: DbClient): Promise<Role | null> {
    return this.db(db).role.findUnique({ where: { name } });
  }

  createRole(name: string, db?: DbClient): Promise<Role> {
    return this.db(db).role.create({
      data: { name },
    });
  }

  ensureRoleExists(name: string, db?: DbClient): Promise<Role> {
    return this.db(db).role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  async assignRoleToUser(
    userId: string,
    roleName: string,
    db?: DbClient,
  ): Promise<UserRole> {
    const role = await this.ensureRoleExists(roleName, db);
    return this.db(db).userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      create: {
        userId,
        roleId: role.id,
      },
      update: {},
    });
  }

  async removeRoleFromUser(
    userId: string,
    roleName: string,
    db?: DbClient,
  ): Promise<void> {
    const role = await this.findByName(roleName, db);
    if (!role) {
      return;
    }

    await this.db(db).userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });
  }

  async replaceUserRoles(
    userId: string,
    roleNames: string[],
    db?: DbClient,
  ): Promise<string[]> {
    const uniqueRoleNames = Array.from(new Set(roleNames));
    const roles = await Promise.all(
      uniqueRoleNames.map((roleName) => this.ensureRoleExists(roleName, db)),
    );

    await this.db(db).userRole.deleteMany({
      where: { userId },
    });

    if (roles.length > 0) {
      await this.db(db).userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });
    }

    return uniqueRoleNames;
  }

  async getUserRoles(userId: string, db?: DbClient): Promise<string[]> {
    const assignments = await this.db(db).userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return assignments.map((entry) => entry.role.name);
  }

  async listUsersByRole(roleName: string, db?: DbClient): Promise<string[]> {
    const role = await this.findByName(roleName, db);
    if (!role) {
      return [];
    }

    const assignments = await this.db(db).userRole.findMany({
      where: { roleId: role.id },
      select: {
        userId: true,
      },
    });

    return assignments.map((entry) => entry.userId);
  }
}
