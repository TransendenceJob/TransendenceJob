import { Test, TestingModule } from '@nestjs/testing';
import { AchivementsController } from './achivements.controller';
import { AchivementsService } from './achivements.service';

describe('AchivementsController', () => {
  let controller: AchivementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchivementsController],
      providers: [AchivementsService],
    }).compile();

    controller = module.get<AchivementsController>(AchivementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
