import { Module } from '@nestjs/common';
import { DailyItemsController } from './daily-items.controller';
import { DailyItemsService } from './daily-items.service';

@Module({
  controllers: [DailyItemsController],
  providers: [DailyItemsService],
})
export class DailyItemsModule {}
