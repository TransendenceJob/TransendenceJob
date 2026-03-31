import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from "crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
	/**
	 * Middleware that assigns or propagates request IDs for distributed tracing.
	 * Looks for 'x-request-id' header; generates UUID if not present.
	 * Attaches ID to request object and response header.
	 * @param req - Express request object (augmented with requestId property)
	 * @param res - Express response object
	 * @param next - Next middleware function
	 * @example
	 * // Client sends: X-Request-Id: abc-123
	 * // Response header includes: X-Request-Id: abc-123
	 * // req.requestId = 'abc-123' available in controllers/services
	 */
	use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
		const header = req.headers['x-request-id'];
		const headerValue = Array.isArray(header) ? header[0] : header;
		const requestId = typeof headerValue === 'string' && headerValue ? headerValue : randomUUID();

		req.requestId = requestId;

		res.setHeader('X-Request-Id', requestId);

		next();
	}
}