import { type Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

export type DbClient = PrismaService | Prisma.TransactionClient;
