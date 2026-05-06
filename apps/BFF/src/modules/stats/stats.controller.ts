import { Controller, Get, Headers, Param } from '@nestjs/common';
import { StatsService } from './stats.service.js';

type RequestContext = {
  requestId?: string;
  authorization?: string;
};

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('users/:userId')
  getPlayerStats(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.statsService.getPlayerStats(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Get('users/:userId/matches')
  getPlayerMatchHistory(
    @Param('userId') userId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.statsService.getPlayerMatchHistory(
      userId,
      this.context(requestId, authorization),
    );
  }

  @Get('matches')
  listMatches(
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.statsService.listMatches(
      this.context(requestId, authorization),
    );
  }

  @Get('matches/:matchId')
  getMatchById(
    @Param('matchId') matchId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.statsService.getMatchById(
      matchId,
      this.context(requestId, authorization),
    );
  }

  @Get('matches/:matchId/members')
  getMatchMembers(
    @Param('matchId') matchId: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.statsService.getMatchMembers(
      matchId,
      this.context(requestId, authorization),
    );
  }

  private context(requestId?: string, authorization?: string): RequestContext {
    return { requestId, authorization };
  }
}
