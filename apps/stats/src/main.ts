import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigSchema } from './config/config.schema';

async function bootstrap() : Promise<void> {
  
  // Validate the config before the app run
  const parsed = ConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    process.exit(1);
  }


  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/internal/stats')
  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }),
  );
  
  app.enableShutdownHooks()
  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port, '0.0.0.0');
}
bootstrap();