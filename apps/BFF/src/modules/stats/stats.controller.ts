import { Controller, Get, Headers, Param, Query, Req, Post, Body, Put } from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';
import { PlayerStatsSchema, type PlayerStats } from './contracts/player-stats.schema';

function computeDerived(stats: Record<string, unknown>) {
  const kills = Number((stats as any).kills ?? 0);
  const deaths = Number((stats as any).deaths ?? 0);
  const wins = Number((stats as any).wins ?? 0);
  const losses = Number((stats as any).losses ?? 0);
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const kd = deaths > 0 ? kills / deaths : kills;
  return { totalMatches, winRate, kd };
}

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  
  @Get('users')
  async getUsers(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
  ) {
    // short path
    //console.log('stats.getUsers path:', req.originalUrl);
    // full URL (protocol + host + path)
    //console.log('stats.getUsers full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);

    return this.service.fetchUsers({ authorization: headers.authorization, params: query });
  }

  @Get('user/:userId')
  async getUserById(@Param('userId') userId: string, @Headers() headers: Record<string, string>) {
    const raw = await this.service.fetchUserById(userId, { authorization: headers.authorization });
    const base = PlayerStatsSchema.parse(raw) as PlayerStats;
    const derived = computeDerived(base as Record<string, unknown>);
    return { ...base, derived };
  }

  @Get('match/:matchId/members')
	async getMatchMembers(
	@Param('matchId') matchId: string,
	@Headers('authorization') authorization?: string,
	) {
	return this.service.fetchMatchMembers(matchId, { authorization });
	}


  /* ADDDED HERE THE */
  // POST /api/stats/user
  @Post('user')
  async createStatsForPlayer(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.createStatsUser(body, { authorization });
  }

  // PUT /api/stats/user/:id
  @Put('user/:id')
  async updateStatsForPlayer(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.UpdateStatsUser(id, body, { authorization });
  }

  // POST /api/stats/match
  @Post('match')
  async createMatch(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.CreateMatch(body, { authorization });
  }

  // POST /api/stats/achievements
  @Post('achievements')
  async createAchievement(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.CreateAchievementUser(body, { authorization });
  }

  // POST /api/stats/achievements/upsert => update
  @Post('achievements/upsert')
  async upsertAchievement(
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.UpsertAcheivement(body, { authorization });
  }

}
