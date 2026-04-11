import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  async create(entry: any) {
    return this.prisma.auditLog.create({
      data: entry,
    });
  }
}

	// create: Inserts a new record into the database.

	// Example: prisma.user.create({ data: { email: 'example@example.com' } })
	// createMany: Inserts multiple records into the database in a single operation.

	// Example: prisma.user.createMany({ data: [{ email: 'a@example.com' }, { email: 'b@example.com' }] })
	// update: Updates an existing record based on a unique identifier.

	// Example: prisma.user.update({ where: { id: 1 }, data: { email: 'updated@example.com' } })
	// updateMany: Updates multiple records that match a filter.

	// Example: prisma.user.updateMany({ where: { status: 'active' }, data: { status: 'inactive' } })
	// upsert: Creates a new record if it does not exist, or updates an existing record.

	// Example: prisma.user.upsert({ where: { id: 1 }, create: { email: 'new@example.com' }, update: { email: 'updated@example.com' } })
	// delete: Deletes a single record based on a unique identifier.

	// Example: prisma.user.delete({ where: { id: 1 } })
	// deleteMany: Deletes multiple records that match a filter.

	// Example: prisma.user.deleteMany({ where: { status: 'inactive' } })
	// $executeRaw: Executes raw SQL queries for custom operations.

	// Example: prisma.$executeRaw(INSERT INTO users (email) VALUES ('raw@example.com'))
	// $queryRaw: Executes raw SQL queries and returns the result.

	// Example: prisma.$queryRaw(SELECT * FROM users WHERE email = 'example@example.com')