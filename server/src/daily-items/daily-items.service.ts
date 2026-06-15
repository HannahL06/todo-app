import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DailyItemStatus, ItemType, type DailyItem, type Item } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ReorderDailyItemsDto } from './dto/reorder-daily-items.dto';

@Injectable()
export class DailyItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureRolloverForDate(targetDate: Date) {
    const latestByItem = await this.prisma.dailyItem.findMany({
      where: {
        date: { lt: targetDate },
        item: {
          isRolling: true,
          scheduledDate: { lte: targetDate },
        },
      },
      include: { item: true },
      orderBy: [{ itemId: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }],
      distinct: ['itemId'],
    });

    if (latestByItem.length === 0) {
      return;
    }

    const existingForTargetDate = await this.prisma.dailyItem.findMany({
      where: { date: targetDate },
      select: { itemId: true, sortOrder: true },
    });

    const existingItemIds = new Set(existingForTargetDate.map((item) => item.itemId));
    const maxSortOrder = existingForTargetDate.reduce((max, item) => {
      if (item.sortOrder == null) {
        return max;
      }
      return Math.max(max, item.sortOrder);
    }, -1);

    const rolloverCandidates = latestByItem.filter(
      (item) => item.status !== DailyItemStatus.COMPLETED && !existingItemIds.has(item.itemId),
    );

    if (rolloverCandidates.length === 0) {
      return;
    }

    await this.prisma.dailyItem.createMany({
      data: rolloverCandidates.map((item, index) => ({
        itemId: item.itemId,
        date: targetDate,
        status: DailyItemStatus.UNTOUCHED,
        sortOrder: maxSortOrder + index + 1,
      })),
      skipDuplicates: true,
    });
  }

  async searchItems(query: string) {
    const q = query?.trim();
    if (!q) {
      return { query: '', items: [] };
    }

    const dailyItems = await this.prisma.dailyItem.findMany({
      where: {
        removedFromToday: false,
        item: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        item: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return {
      query: q,
      items: dailyItems.map((item) => ({
        dailyItemId: item.id,
        itemId: item.item.id,
        name: item.item.name,
        description: item.item.description,
        type: this.fromPrismaItemType(item.item.type),
        status: this.fromPrismaStatus(item.status),
        scheduledDate: item.date.toISOString().slice(0, 10),
      })),
    };
  }

  async getDailyItems(date: string) {
    const normalizedDate = this.parseDate(date);
    await this.ensureRolloverForDate(normalizedDate);
    const items = await this.prisma.dailyItem.findMany({
      where: {
        date: normalizedDate,
        removedFromToday: false,
      },
      include: {
        item: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      date,
      items: items.map((item) => this.toApiDailyItem(item)),
    };
  }

  async createItem(createItemDto: CreateItemDto) {
    const scheduledDate = this.parseDate(createItemDto.scheduledDate);
    const type = this.toPrismaItemType(createItemDto.type ?? 'task');
    const sortOrder = await this.getNextSortOrder(scheduledDate);

    const dailyItem = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: createItemDto.name.trim(),
          description: createItemDto.description?.trim() || null,
          type,
          isRolling: createItemDto.isRolling ?? true,
          scheduledDate,
        },
      });

      return tx.dailyItem.create({
        data: {
          itemId: item.id,
          date: scheduledDate,
          sortOrder,
        },
        include: {
          item: true,
        },
      });
    });

    return this.toApiDailyItem(dailyItem);
  }

  async cycleStatus(dailyItemId: string) {
    const existingItem = await this.prisma.dailyItem.findUnique({
      where: { id: dailyItemId },
      include: { item: true },
    });

    if (!existingItem) {
      throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);
    }

    const updatedItem = await this.prisma.dailyItem.update({
      where: { id: dailyItemId },
      data: {
        status: this.nextStatus(existingItem.status),
      },
      include: {
        item: true,
      },
    });

    return this.toApiDailyItem(updatedItem);
  }

  async removeForToday(dailyItemId: string) {
    const existingItem = await this.prisma.dailyItem.findUnique({
      where: { id: dailyItemId },
      select: { id: true },
    });

    if (!existingItem) {
      throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);
    }

    await this.prisma.dailyItem.update({
      where: { id: dailyItemId },
      data: { removedFromToday: true },
    });

    return { success: true };
  }

  async stopRolling(dailyItemId: string) {
    const existingItem = await this.prisma.dailyItem.findUnique({
      where: { id: dailyItemId },
      select: { id: true, itemId: true },
    });

    if (!existingItem) {
      throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);
    }

    await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id: existingItem.itemId },
        data: { isRolling: false },
      }),
      this.prisma.dailyItem.update({
        where: { id: dailyItemId },
        data: { removedFromToday: true },
      }),
    ]);

    return { success: true };
  }

  async reorderDailyItems(reorderDailyItemsDto: ReorderDailyItemsDto) {
    const date = this.parseDate(reorderDailyItemsDto.date);
    const orderedIds = reorderDailyItemsDto.orderedDailyItemIds;

    const dailyItems = await this.prisma.dailyItem.findMany({
      where: {
        date,
        removedFromToday: false,
      },
      select: { id: true },
    });

    const existingIds = new Set(dailyItems.map((item) => item.id));
    if (orderedIds.length !== dailyItems.length) {
      throw new BadRequestException('orderedDailyItemIds must include every item in the selected day.');
    }

    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Daily item ${id} is not part of ${reorderDailyItemsDto.date}.`);
      }
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.dailyItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { success: true };
  }

  private async getNextSortOrder(date: Date) {
    const latestDailyItem = await this.prisma.dailyItem.findFirst({
      where: { date, removedFromToday: false },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return (latestDailyItem?.sortOrder ?? -1) + 1;
  }

  private parseDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use YYYY-MM-DD');
    }

    return new Date(`${date}T00:00:00.000Z`);
  }

  private nextStatus(status: DailyItemStatus) {
    if (status === DailyItemStatus.UNTOUCHED) {
      return DailyItemStatus.IN_PROGRESS;
    }

    if (status === DailyItemStatus.IN_PROGRESS) {
      return DailyItemStatus.COMPLETED;
    }

    return DailyItemStatus.UNTOUCHED;
  }

  private toPrismaItemType(type: 'task' | 'note' | 'appointment') {
    if (type === 'note') {
      return ItemType.NOTE;
    }

    if (type === 'appointment') {
      return ItemType.APPOINTMENT;
    }

    return ItemType.TASK;
  }

  private toApiDailyItem(dailyItem: DailyItem & { item: Pick<Item, 'id' | 'name' | 'description' | 'type' | 'isRolling'> }) {
    return {
      dailyItemId: dailyItem.id,
      itemId: dailyItem.item.id,
      type: this.fromPrismaItemType(dailyItem.item.type),
      name: dailyItem.item.name,
      description: dailyItem.item.description,
      notes: dailyItem.notes,
      status: this.fromPrismaStatus(dailyItem.status),
      sortOrder: dailyItem.sortOrder,
      isRolling: dailyItem.item.isRolling,
      scheduledDate: dailyItem.date.toISOString().slice(0, 10),
    };
  }

  private fromPrismaStatus(status: DailyItemStatus) {
    if (status === DailyItemStatus.IN_PROGRESS) {
      return 'in-progress';
    }

    if (status === DailyItemStatus.COMPLETED) {
      return 'completed';
    }

    return 'untouched';
  }

  private fromPrismaItemType(type: ItemType) {
    if (type === ItemType.NOTE) {
      return 'note';
    }

    if (type === ItemType.APPOINTMENT) {
      return 'appointment';
    }

    return 'task';
  }
}
