import { Module } from '@nestjs/common';
import { VisualResourcesService } from './visual-resources.service';

@Module({
  providers: [VisualResourcesService],
  exports: [VisualResourcesService],
})
export class VisualResourcesModule {}
