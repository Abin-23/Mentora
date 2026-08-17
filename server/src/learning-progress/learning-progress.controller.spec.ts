import { Test, TestingModule } from '@nestjs/testing';
import { LearningProgressController } from './learning-progress.controller';

describe('LearningProgressController', () => {
  let controller: LearningProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningProgressController],
    }).compile();

    controller = module.get<LearningProgressController>(LearningProgressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
