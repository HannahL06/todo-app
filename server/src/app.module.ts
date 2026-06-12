import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DailyItemsModule } from './daily-items/daily-items.module';

@Module({
  imports: [PrismaModule, DailyItemsModule],
})
export class AppModule {}
