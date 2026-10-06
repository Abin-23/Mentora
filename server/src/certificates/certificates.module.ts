import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AdaptiveLearningModule } from '../adaptive-learning/adaptive-learning.module';

@Module({
  imports: [PrismaModule, AdaptiveLearningModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
