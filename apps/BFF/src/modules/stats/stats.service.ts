import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';

type RequestContext = {
	requestId?: string;
	authorization?: string;
};

@Injectable()
export class StatsService {
	constructor(private readonly config: BffConfigService) {}

	getPlayerStats(userId: string, context: RequestContext) {
		return this.callStatsService({
			method: 'GET',
			path: `/internal/stats/user/${encodeURIComponent(userId)}`,
			context,
		});
	}

	getPlayerMatchHistory(userId: string, context: RequestContext) {
		return this.callStatsService({
			method: 'GET',
			path: `/internal/stats/user/${encodeURIComponent(userId)}/matches`,
			context,
		});
	}

	listMatches(context: RequestContext) {
		return this.callStatsService({
			method: 'GET',
			path: '/internal/stats/match',
			context,
		});
	}

	getMatchById(matchId: string, context: RequestContext) {
		return this.callStatsService({
			method: 'GET',
			path: `/internal/stats/match/${encodeURIComponent(matchId)}`,
			context,
		});
	}

	getMatchMembers(matchId: string, context: RequestContext) {
		return this.callStatsService({
			method: 'GET',
			path: `/internal/stats/match/${encodeURIComponent(matchId)}/members`,
			context,
		});
	}

	private async callStatsService<T>(input: {
		method: 'GET';
		path: string;
		context: RequestContext;
		params?: Record<string, unknown>;
	}): Promise<T> {
		const headers: Record<string, string> = {
			'x-service-name': 'bff',
		};

		if (input.context.requestId) {
			headers['x-request-id'] = input.context.requestId;
		}

		if (input.context.authorization) {
			headers.authorization = input.context.authorization;
		}

		try {
			const response = await axios.request<T>({
				method: input.method,
				url: `${this.config.stats.serviceUrl}${input.path}`,
				headers,
				params: input.params,
			});

			return response.data;
		} catch (error) {
			this.throwNormalizedError(error);
		}
	}

	private throwNormalizedError(error: unknown): never {
		if (error instanceof AxiosError) {
			const status = error.response?.status;
			const data: unknown = error.response?.data;
			const message =
				typeof data === 'object' && data !== null && 'message' in data &&
				typeof (data as { message?: unknown }).message === 'string'
					? (data as { message: string }).message
					: error.message;

			throw new HttpException(
				{
					code: `stats_service_${status ?? 'error'}`,
					message,
					details: data,
				},
				status ?? 502,
			);
		}

		throw new BadGatewayException({
			code: 'stats_service_unreachable',
			message: 'Unable to reach stats service.',
			details: error,
		});
	}
}