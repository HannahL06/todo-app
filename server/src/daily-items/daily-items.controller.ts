import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailyItemsService } from './daily-items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ReorderDailyItemsDto } from './dto/reorder-daily-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class DailyItemsController {
  constructor(private readonly dailyItemsService: DailyItemsService) {}

  @Get('daily-items')
  getDailyItems(@Query('date') date: string, @Request() req: AuthRequest) {
    return this.dailyItemsService.getDailyItems(date, req.user.userId);
  }

  @Get('items/search')
  searchItems(
    @Request() req: AuthRequest,
    @Query('q') query: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.dailyItemsService.searchItems(req.user.userId, query, {
      from,
      to,
      status,
      type,
      sortBy,
      sortOrder,
    });
  }

  @Get('records/dates')
  getPastDates(@Request() req: AuthRequest) {
    return this.dailyItemsService.getPastDates(req.user.userId);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: AuthRequest,
  ) {
    return this.dailyItemsService.updateItem(itemId, req.user.userId, updateItemDto);
  }

  @Post('items')
  createItem(@Body() createItemDto: CreateItemDto, @Request() req: AuthRequest) {
    return this.dailyItemsService.createItem(createItemDto, req.user.userId);
  }

  @Post('daily-items/:dailyItemId/cycle-status')
  cycleStatus(@Param('dailyItemId') dailyItemId: string, @Request() req: AuthRequest) {
    return this.dailyItemsService.cycleStatus(dailyItemId, req.user.userId);
  }

  @Post('daily-items/:dailyItemId/remove-today')
  removeForToday(@Param('dailyItemId') dailyItemId: string, @Request() req: AuthRequest) {
    return this.dailyItemsService.removeForToday(dailyItemId, req.user.userId);
  }

  @Post('daily-items/:dailyItemId/stop-rolling')
  stopRolling(@Param('dailyItemId') dailyItemId: string, @Request() req: AuthRequest) {
    return this.dailyItemsService.stopRolling(dailyItemId, req.user.userId);
  }

  @Post('daily-items/reorder')
  reorderDailyItems(@Body() reorderDailyItemsDto: ReorderDailyItemsDto, @Request() req: AuthRequest) {
    return this.dailyItemsService.reorderDailyItems(reorderDailyItemsDto, req.user.userId);
  }
}
