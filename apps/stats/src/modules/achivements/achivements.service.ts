import { Injectable } from '@nestjs/common';
import { CreateAchivementDto } from './dto/create-achivement.dto';
import { UpdateAchivementDto } from './dto/update-achivement.dto';

@Injectable()
export class AchivementsService {
  create(createAchivementDto: CreateAchivementDto) {
    return 'This action adds a new achivement';
  }

  findAll() {
    return `This action returns all achivements`;
  }

  findOne(id: number) {
    return `This action returns a #${id} achivement`;
  }

  update(id: number, updateAchivementDto: UpdateAchivementDto) {
    return `This action updates a #${id} achivement`;
  }

  remove(id: number) {
    return `This action removes a #${id} achivement`;
  }
}
