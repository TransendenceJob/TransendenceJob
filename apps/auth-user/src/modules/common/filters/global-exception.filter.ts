import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";


@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse();
		const req = ctx.getRequest();

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const response = exception.getResponse();
			return res.status(status).json({
				statusCode: status,
				path: req?.url,
				error: response,
			});
		}

		// Fallback for unexpected errors
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			path: req?.url,
			error: { message: 'Internal error' },
		});
	}
}