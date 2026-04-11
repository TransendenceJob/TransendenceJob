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
  console.log(`the port ${process.env.PORT} is correct`)


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
  // Parse and validate the port
  
  const port = Number(process.env.PORT?? 3004);

  if (isNaN(port)) {
    console.error("Invalid PORT: Must be a valid number.");
    process.exit(1); // Exit if PORT is invalid
  }

  await app.listen(port, '0.0.0.0');
}
bootstrap();