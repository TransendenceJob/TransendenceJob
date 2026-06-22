import { BadGatewayException, Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';
import { PlayerStatsDto } from '../auth/contracts/dto/auth-contracts.dto';

type RequestContext = {
  authorization?: string;
  params?: Record<string, unknown>;
};

@Injectable()
export class StatsService {
  constructor(private readonly config: BffConfigService) {}

  async fetchUsers(context: RequestContext): Promise<PlayerStatsDto[]> {
    // stats service exposes list at `/internal/stats/user` per A_REQ.http
    return this.callStatsService<PlayerStatsDto[]>({
		method: 'GET',
		path: '/internal/stats/user',
		context
	 });
  }

  async fetchUserById(
    userId: string,
    context: RequestContext,
  ): Promise<PlayerStatsDto> {
    return this.callStatsService<PlayerStatsDto>({
      method: 'GET',
      path: `/internal/stats/user/${encodeURIComponent(userId)}`,
      context,
    });
  }

  private async callStatsService<T = PlayerStatsDto>(
	input: { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: string;
	context: RequestContext;
	data?: unknown;
	params?: Record<string, unknown>;
	}): Promise<T> {
    const headers: Record<string, string> = { 'x-service-name': 'bff' };
    if (input.context.authorization)
      headers.authorization = input.context.authorization;

    try {
      const url = `${this.config.stats.serviceUrl}${input.path}`;
      const response = await axios.request<T>({
        method: input.method as any,
		    url,
        headers,
        data: input.data,
        params: input.context.params ?? input.params,
      });
      // optional: if response.data has updatedAt, print it for quick verification
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybe = response.data as any;
        if (maybe && (maybe.updatedAt || maybe.updated_at)) {
        }
      } catch (e) {
        /* ignore */
      }
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 502;
        throw new BadGatewayException({
          code: `stats_service_${status}`,
          message: error.message,
          details: error.response?.data,
        });
      }
      throw new BadGatewayException({
        code: 'stats_service_unreachable',
        message: 'Unable to reach stats service',
        details: error,
      });
    }
  }
  async update(
    userId: string,
    data: any,
    context: RequestContext,
  ): Promise<PlayerStatsDto> {
    return this.callStatsService<PlayerStatsDto>({
      method: 'PATCH',
      path: `/internal/stats/user/${encodeURIComponent(userId)}`,
      context,
      data,
    });
  }

  // fetch member of match:
  async fetchMatchMembers(matchId: string, context: { authorization?: string }) {
	return this.callStatsService({
		method: 'GET',
		path: `/internal/stats/match/${matchId}/members`,
		context,
	});
	}

  // create a stats user
  async createStatsUser(body: any, context: { authorization?: string }){
    return this.callStatsService({
      method:'POST',
      path: '/internal/stats/user',
      data: body,
      context
    })
  }

  // PUT /api/stats/user/:id
  async UpdateStatsUser(id : string, body : any, context : {authorization ?: string}){
    return this.callStatsService({
      method : 'PUT',
      path: `/internal/stats/user/${id}`,
      data: body,
      context
    })
  }

  // create a match
  async CreateMatch(body: any, context : {authorization?: string}){
    return this.callStatsService({
      method: 'POST',
      path: '/internal/stats/match',
      data: body,
      context
    })
  }

  // create achivement
  async CreateAchievementUser(body: any, context : {authorization?: string}){
    return this.callStatsService({
      method: 'POST',
      path: '/internal/stats/achievements',
      data: body,
      context
    })
  }

  async UpsertAcheivement(body: any, context : {authorization?: string}){
    return this.callStatsService({
      method: 'POST',
      path: '/internal/stats/achievements/upsert',
      data: body,
      context
    })
  }

}
