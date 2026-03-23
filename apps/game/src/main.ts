import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';

/**
 * Main code that runs, when we start our application with "npm run start"
 */
async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
