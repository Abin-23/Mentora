import { Module } from '@nestjs/common';
import { AdaptiveLearningController } from './adaptive-learning.controller';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [Neo4jModule, PrismaModule, ResourcesModule],
  controllers: [AdaptiveLearningController],
  providers: [AdaptiveLearningService],
  exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule {}
