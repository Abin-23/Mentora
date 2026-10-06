import { Test, TestingModule } from '@nestjs/testing';
import { VisualResourcesService } from './visual-resources.service';

describe('VisualResourcesService', () => {
  let service: VisualResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisualResourcesService],
    }).compile();

    service = module.get<VisualResourcesService>(VisualResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
