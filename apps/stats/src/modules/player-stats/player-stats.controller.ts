import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PlayerStatsService } from './player-stats.service.js';
import { CreateStatsDto } from './dto/statsRegister.dto.js';
import type { UUID } from 'node:crypto';
import { UpdatePlayerDto } from './dto/updatePlayer.dto.js';
// import { PlayerStatsService } from './player-stats.service';

@Controller("user")
export class PlayerStatsController {
	constructor(private service : PlayerStatsService){}


	@Post()
	createPlayerStats(@Body() createStatsDto : CreateStatsDto){
		return this.service.createStatsForUser(createStatsDto);
	}

	@Put(':id')
	updatePlayerStats(@Param('id') id: UUID, @Body() updatePlayerDto: UpdatePlayerDto) {
		const updated = this.service.update(id, updatePlayerDto)
		return updated
		
	}
	@Get()
	getAll(){
		return this.service.getAll();
	}

	@Get(':id')
	getStatsById(@Param('id') id: UUID){
		return this.service.getStatsById(id);
	}
}
