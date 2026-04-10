import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() : Promise<void> {
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