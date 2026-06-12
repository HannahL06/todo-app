import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { DailyItemsService } from './daily-items.service';

@Controller('api/v1')
export class DailyItemsController {
  constructor(private readonly dailyItemsService: DailyItemsService) {}

  @Get('daily-items')
  getDailyItems(@Query('date') date: string) {
    return this.dailyItemsService.getDailyItems(date);
  }

  @Post('items')
  createItem(@Body() createItemDto: CreateItemDto) {
    return this.dailyItemsService.createItem(createItemDto);
  }

  @Post('daily-items/:dailyItemId/cycle-status')
  cycleStatus(@Param('dailyItemId') dailyItemId: string) {
    return this.dailyItemsService.cycleStatus(dailyItemId);
  }
}
