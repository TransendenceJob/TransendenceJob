import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BffConfigService } from './modules/config/bff-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(BffConfigService);
  await app.listen(config.app.port);
}
void bootstrap();
