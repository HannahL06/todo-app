import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DailyItemStatus, ItemType, type DailyItem, type Item } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class DailyItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyItems(date: string) {
    const normalizedDate = this.parseDate(date);
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
      status: this.fromPrismaStatus(dailyItem.status),
      sortOrder: dailyItem.sortOrder,
      isRolling: dailyItem.item.isRolling,
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
