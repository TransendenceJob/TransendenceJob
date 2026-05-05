import { Controller, Get, Headers, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';

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
    console.log('stats.getUsers path:', req.originalUrl);
    // full URL (protocol + host + path)
    console.log('stats.getUsers full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);

    return this.service.fetchUsers({ authorization: headers.authorization, params: query });
  }

  @Get('user/:userId')
  async getUserById(@Param('userId') userId: string, @Headers() headers: Record<string, string>) {
    return this.service.fetchUserById(userId, { authorization: headers.authorization });
  }
}
