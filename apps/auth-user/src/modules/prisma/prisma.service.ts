import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuthConfigService } from '../config/auth-config.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly authConfig: AuthConfigService) {
    const connectionString = authConfig.db.url;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  /**
   * Connects to the database on module initialization.
   * Framework lifecycle hook; called automatically by NestJS.
   * @returns Promise that resolves when connection is established
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Disconnects from the database on module destruction.
   * Framework lifecycle hook; called automatically by NestJS on shutdown.
   * @returns Promise that resolves when connection is closed
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Enables graceful shutdown hooks.
   * Ensures database connection is properly closed before process exits.
   * Call this from app bootstrap or main.ts.
   * @param app - The NestJS application instance
   * @example
   * const app = await NestFactory.create(AppModule);
   * prismaService.enableShutdownHooks(app);
   */
  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
