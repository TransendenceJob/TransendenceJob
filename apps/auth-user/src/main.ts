import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filter';




async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	app.useGlobalFilters(new GlobalExceptionFilter());

	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector)),
	);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


