import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { ReorderDailyItemsDto } from './dto/reorder-daily-items.dto';
import { DailyItemsService } from './daily-items.service';

@Controller('api/v1')
export class DailyItemsController {
  constructor(private readonly dailyItemsService: DailyItemsService) {}

  @Get('daily-items')
  getDailyItems(@Query('date') date: string) {
    return this.dailyItemsService.getDailyItems(date);
  }

  @Get('items/search')
  searchItems(@Query('q') query: string) {
    return this.dailyItemsService.searchItems(query);
  }

  @Post('items')
  createItem(@Body() createItemDto: CreateItemDto) {
    return this.dailyItemsService.createItem(createItemDto);
  }

  @Post('daily-items/:dailyItemId/cycle-status')
  cycleStatus(@Param('dailyItemId') dailyItemId: string) {
    return this.dailyItemsService.cycleStatus(dailyItemId);
  }

  @Post('daily-items/:dailyItemId/remove-today')
  removeForToday(@Param('dailyItemId') dailyItemId: string) {
    return this.dailyItemsService.removeForToday(dailyItemId);
  }

  @Post('daily-items/:dailyItemId/stop-rolling')
  stopRolling(@Param('dailyItemId') dailyItemId: string) {
    return this.dailyItemsService.stopRolling(dailyItemId);
  }

  @Post('daily-items/reorder')
  reorderDailyItems(@Body() reorderDailyItemsDto: ReorderDailyItemsDto) {
    return this.dailyItemsService.reorderDailyItems(reorderDailyItemsDto);
  }
}
