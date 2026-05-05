import { BadGatewayException, Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';

type RequestContext = { authorization?: string; params?: Record<string, unknown> };

@Injectable()
export class StatsService {
  constructor(private readonly config: BffConfigService) {}

  async fetchUsers(context: RequestContext) {
    // stats service exposes list at `/internal/stats/user` per A_REQ.http
    return this.callStatsService({ method: 'GET', path: '/internal/stats/user', context });
  }

  async fetchUserById(userId: string, context: RequestContext) {
    return this.callStatsService({ method: 'GET', path: `/internal/stats/user/${encodeURIComponent(userId)}`, context });
  }

  private async callStatsService<T>(input: { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; context: RequestContext; data?: unknown; params?: Record<string, unknown>; }): Promise<T> {
    const headers: Record<string, string> = { 'x-service-name': 'bff' };
    if (input.context.authorization) headers.authorization = input.context.authorization;

    try {
      const response = await axios.request<T>({
        method: input.method as any,
        url: `${this.config.stats.serviceUrl}${input.path}`,
        headers,
        data: input.data,
        params: input.context.params ?? input.params,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 502;
        throw new BadGatewayException({ code: `stats_service_${status}`, message: error.message, details: error.response?.data });
      }
      throw new BadGatewayException({ code: 'stats_service_unreachable', message: 'Unable to reach stats service', details: error });
    }
  }
}
