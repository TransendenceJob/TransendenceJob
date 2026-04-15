import { Test, TestingModule } from '@nestjs/testing';
import { WeaponsService } from './weapons.service';

describe('WeaponsService', () => {
  let service: WeaponsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeaponsService],
    }).compile();

    service = module.get<WeaponsService>(WeaponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
