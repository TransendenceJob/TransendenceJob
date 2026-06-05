import { Test, TestingModule } from '@nestjs/testing';
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';

describe('WeaponsController', () => {
  let controller: WeaponsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeaponsController],
      providers: [WeaponsService],
    }).compile();

    controller = module.get<WeaponsController>(WeaponsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
