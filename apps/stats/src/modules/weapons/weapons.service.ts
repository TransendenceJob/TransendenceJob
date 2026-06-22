import { Injectable } from '@nestjs/common';
import { CreateWeaponDto } from './dto/create-weapon.dto';
import { UpdateWeaponDto } from './dto/update-weapon.dto';

@Injectable()
export class WeaponsService {
  create(createWeaponDto: CreateWeaponDto) {
    return 'This action adds a new weapon';
  }

  findAll() {
    return `This action returns all weapons`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weapon`;
  }

  update(id: number, updateWeaponDto: UpdateWeaponDto) {
    return `This action updates a #${id} weapon`;
  }

  remove(id: number) {
    return `This action removes a #${id} weapon`;
  }
}
