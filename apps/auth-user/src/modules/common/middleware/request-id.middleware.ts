import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from "crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
	use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
		const header = req.headers['x-request-id'];
		const headerValue = Array.isArray(header) ? header[0] : header;
		const requestId = typeof headerValue === 'string' && headerValue ? headerValue : randomUUID();

		req.requestId = requestId;

		res.setHeader('X-Request-Id', requestId);

		next();
	}
}