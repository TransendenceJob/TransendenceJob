import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { SocialConfigService } from './modules/config/social-config.service';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/internal');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  const prisma = app.get(PrismaService);
  const config = app.get(SocialConfigService);
  prisma.enableShutdownHooks(app);
  await app.listen(config.appPort, '0.0.0.0');
}
bootstrap();
