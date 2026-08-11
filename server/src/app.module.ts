import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { TopicsModule } from './topics/topics.module';
import { ResourcesModule } from './resources/resources.module';
import { PurchasesModule } from './purchases/purchases.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MailModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    TopicsModule,
    ResourcesModule,
    PurchasesModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
