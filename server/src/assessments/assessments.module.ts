import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AiGenerationService } from './ai-generation.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AiGenerationService, PrismaService],
  exports: [AssessmentsService, AiGenerationService],
})
export class AssessmentsModule {}
