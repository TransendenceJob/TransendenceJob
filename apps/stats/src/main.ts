import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() : Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/internal/auth')
  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }),
  );
  
  app.enableShutdownHooks()
  await app.listen(3004);
}
bootstrap();