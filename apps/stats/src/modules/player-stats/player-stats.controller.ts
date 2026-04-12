import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlayerStatsService } from './player-stats.service.js';
import { CreateStatsDto } from './dto/statsRegister.dto.js';
// import { PlayerStatsService } from './player-stats.service';

@Controller("user")
export class PlayerStatsController {
	constructor(private service : PlayerStatsService){}


	@Post()
	createPlayerStats(@Body() createStatsDto : CreateStatsDto){

		return this.service.createStatsForUser(createStatsDto);
	}
}




// @Controller()
// export class MatchStatsController {
// 	constructor(private service : PlayerStatsService){}

// 	@Get('kda')
// 	returnKdaStat(){
		
// 		return 1;
// 	}
// }