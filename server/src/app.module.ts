import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DailyItemsModule } from './daily-items/daily-items.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, DailyItemsModule, AuthModule],
})
export class AppModule {}
