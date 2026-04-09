import { Controller, Param, Post } from '@nestjs/common';
import { PlayerStatsService } from './player-stats.service.js';
// import { PlayerStatsService } from './player-stats.service';

@Controller('internal/stats')
export class PlayerStatsController {
	constructor(private service : PlayerStatsService){}

	@Post()
	createPlayerStats(@Param(':id') id: number){
		return this.service.createStatsForUser(Number(id));
	}
}
