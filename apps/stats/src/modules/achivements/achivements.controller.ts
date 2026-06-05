import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	ParseUUIDPipe,
} from '@nestjs/common';
import { AchievementsService } from './achivements.service';
import { CreateAchievementDto } from './dto/create-achivement.dto';
import { UpdateAchievementDto } from './dto/update-achivement.dto';

@Controller('achievements')
export class AchievementsController {
	constructor(private readonly achievementsService: AchievementsService) {}

	@Post()
	create(@Body() dto: CreateAchievementDto) {
		return this.achievementsService.create(dto);
	}

	@Post('upsert')
	createOrUpdate(@Body() dto: CreateAchievementDto) {
		return this.achievementsService.createOrUpdate(dto);
	}

	@Get()
	findAll() {
		return this.achievementsService.findAll();
	}

	@Get(':id')
	findOne(@Param('id', ParseUUIDPipe) id: string) {
		return this.achievementsService.findOne(id);
	}

	@Get('user/:userId')
	findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
		return this.achievementsService.findByUserId(userId);
	}

	@Patch(':id')
	update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateAchievementDto,
	) {
		return this.achievementsService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id', ParseUUIDPipe) id: string) {
		return this.achievementsService.remove(id);
	}
}
