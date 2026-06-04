import { Injectable } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achivement.dto';
import { UpdateAchievementDto } from './dto/update-achivement.dto';
import { AchievementRepository } from '../persistence/repository/achievement.repository';

@Injectable()
export class AchievementsService {
	constructor(private readonly repo: AchievementRepository) {}

	create(dto: CreateAchievementDto) {
		return this.repo.create(dto);
	}

	createOrUpdate(dto: CreateAchievementDto) {
		return this.repo.upsertByUserAndType(dto);
	}

	findAll() {
		return this.repo.findAll();
	}

	findOne(id: string) {
		return this.repo.findById(id);
	}

	findByUserId(userId: string) {
		return this.repo.findByUserId(userId);
	}

	update(id: string, dto: UpdateAchievementDto) {
		return this.repo.update(id, dto);
	}

	remove(id: string) {
		return this.repo.remove(id);
	}
}
