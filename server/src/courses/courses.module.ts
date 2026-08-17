import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [PrismaModule, AssessmentsModule, ResourcesModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
