import { Module } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { LearningProgressController } from './learning-progress.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LearningProgressService],
  controllers: [LearningProgressController],
  exports: [LearningProgressService],
})
export class LearningProgressModule {}
