import { Controller, Get, Param, Post } from '@nestjs/common';
import { PlayerStatsService } from './player-stats.service.js';
// import { PlayerStatsService } from './player-stats.service';

@Controller()
export class PlayerStatsController {
	constructor(private service : PlayerStatsService){}

	@Post('id')
	createPlayerStats(@Param(':id') id: number){

		return this.service.createStatsForUser(Number(id));
	}
}


@Controller()
export class MatchStatsController {
	constructor(private service : PlayerStatsService){}

	@Get('kda')
	returnKdaStat(){
		
		return 1;
	}
}