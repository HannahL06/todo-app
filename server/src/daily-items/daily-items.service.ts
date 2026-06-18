import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DailyItemStatus, ItemType, type DailyItem, type Item } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ReorderDailyItemsDto } from './dto/reorder-daily-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class DailyItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureRolloverForDate(userId: string, targetDate: Date) {
    const latestByItem = await this.prisma.dailyItem.findMany({
      where: {
        userId,
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

    if (latestByItem.length === 0) return;

    const existingForTargetDate = await this.prisma.dailyItem.findMany({
      where: { userId, date: targetDate },
      select: { itemId: true, sortOrder: true },
    });

    const existingItemIds = new Set(existingForTargetDate.map((d) => d.itemId));
    const maxSortOrder = existingForTargetDate.reduce(
      (max, d) => (d.sortOrder != null ? Math.max(max, d.sortOrder) : max),
      -1,
    );

    const candidates = latestByItem.filter(
      (d) => d.status !== DailyItemStatus.COMPLETED && !existingItemIds.has(d.itemId),
    );

    if (candidates.length === 0) return;

    await this.prisma.dailyItem.createMany({
      data: candidates.map((d, i) => ({
        itemId: d.itemId,
        userId,
        date: targetDate,
        status: DailyItemStatus.UNTOUCHED,
        sortOrder: maxSortOrder + i + 1,
      })),
      skipDuplicates: true,
    });
  }

  async searchItems(userId: string, query: string, filters?: {
    from?: string; to?: string; status?: string; type?: string; sortBy?: string; sortOrder?: string;
  }) {
    const q = query?.trim();
    const where: Record<string, unknown> = { userId, removedFromToday: false };

    if (q && q.length >= 2) {
      where['item'] = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    if (filters?.from || filters?.to) {
      where['date'] = {
        ...(filters?.from ? { gte: this.parseDate(filters.from) } : {}),
        ...(filters?.to ? { lte: this.parseDate(filters.to) } : {}),
      };
    }

    if (filters?.status) {
      const statusMap: Record<string, DailyItemStatus> = {
        untouched: DailyItemStatus.UNTOUCHED,
        'in-progress': DailyItemStatus.IN_PROGRESS,
        completed: DailyItemStatus.COMPLETED,
      };
      const mapped = statusMap[filters.status];
      if (mapped) where['status'] = mapped;
    }

    if (filters?.type) {
      const typeMap: Record<string, ItemType> = {
        task: ItemType.TASK, note: ItemType.NOTE, appointment: ItemType.APPOINTMENT,
      };
      const mapped = typeMap[filters.type];
      if (mapped) {
        (where['item'] as Record<string, unknown>) = {
          ...((where['item'] as Record<string, unknown>) ?? {}),
          type: mapped,
        };
      }
    }

    const sortField = filters?.sortBy === 'status' ? 'status' : 'date';
    const sortDir = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

    const dailyItems = await this.prisma.dailyItem.findMany({
      where,
      include: { item: true },
      orderBy: [{ [sortField]: sortDir }, { createdAt: 'desc' }],
      take: 100,
    });

    return {
      query: q ?? '',
      items: dailyItems.map((d) => ({
        dailyItemId: d.id,
        itemId: d.item.id,
        name: d.item.name,
        description: d.item.description,
        type: this.fromPrismaItemType(d.item.type),
        status: this.fromPrismaStatus(d.status),
        scheduledDate: d.date.toISOString().slice(0, 10),
      })),
    };
  }

  async updateItem(itemId: string, userId: string, updateItemDto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== userId) throw new NotFoundException(`Item ${itemId} not found.`);

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        ...(updateItemDto.name ? { name: updateItemDto.name.trim() } : {}),
        ...(updateItemDto.description !== undefined ? { description: updateItemDto.description?.trim() || null } : {}),
        ...(updateItemDto.isRolling !== undefined ? { isRolling: updateItemDto.isRolling } : {}),
      },
    });

    return { itemId: updated.id, name: updated.name, description: updated.description, isRolling: updated.isRolling };
  }

  async getPastDates(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = await this.prisma.dailyItem.findMany({
      where: { userId, date: { lt: today }, removedFromToday: false },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 90,
    });

    return {
      dates: rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        weekday: r.date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      })),
    };
  }

  async getDailyItems(date: string, userId: string) {
    const normalizedDate = this.parseDate(date);
    await this.ensureRolloverForDate(userId, normalizedDate);
    const items = await this.prisma.dailyItem.findMany({
      where: { userId, date: normalizedDate, removedFromToday: false },
      include: { item: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { date, items: items.map((d) => this.toApiDailyItem(d)) };
  }

  async createItem(createItemDto: CreateItemDto, userId: string) {
    const scheduledDate = this.parseDate(createItemDto.scheduledDate);
    const type = this.toPrismaItemType(createItemDto.type ?? 'task');
    const sortOrder = await this.getNextSortOrder(userId, scheduledDate);

    const dailyItem = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          userId,
          name: createItemDto.name.trim(),
          description: createItemDto.description?.trim() || null,
          type,
          isRolling: createItemDto.isRolling ?? true,
          scheduledDate,
        },
      });
      return tx.dailyItem.create({
        data: { itemId: item.id, userId, date: scheduledDate, sortOrder },
        include: { item: true },
      });
    });

    return this.toApiDailyItem(dailyItem);
  }

  async cycleStatus(dailyItemId: string, userId: string) {
    const existing = await this.prisma.dailyItem.findUnique({
      where: { id: dailyItemId },
      include: { item: true },
    });
    if (!existing || existing.userId !== userId) throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);

    const updated = await this.prisma.dailyItem.update({
      where: { id: dailyItemId },
      data: { status: this.nextStatus(existing.status) },
      include: { item: true },
    });
    return this.toApiDailyItem(updated);
  }

  async removeForToday(dailyItemId: string, userId: string) {
    const existing = await this.prisma.dailyItem.findUnique({ where: { id: dailyItemId }, select: { id: true, userId: true } });
    if (!existing || existing.userId !== userId) throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);
    await this.prisma.dailyItem.update({ where: { id: dailyItemId }, data: { removedFromToday: true } });
    return { success: true };
  }

  async stopRolling(dailyItemId: string, userId: string) {
    const existing = await this.prisma.dailyItem.findUnique({ where: { id: dailyItemId }, select: { id: true, itemId: true, userId: true } });
    if (!existing || existing.userId !== userId) throw new NotFoundException(`Daily item ${dailyItemId} was not found.`);
    await this.prisma.$transaction([
      this.prisma.item.update({ where: { id: existing.itemId }, data: { isRolling: false } }),
      this.prisma.dailyItem.update({ where: { id: dailyItemId }, data: { removedFromToday: true } }),
    ]);
    return { success: true };
  }

  async reorderDailyItems(dto: ReorderDailyItemsDto, userId: string) {
    const date = this.parseDate(dto.date);
    const orderedIds = dto.orderedDailyItemIds;

    const dailyItems = await this.prisma.dailyItem.findMany({
      where: { userId, date, removedFromToday: false },
      select: { id: true },
    });

    const existingIds = new Set(dailyItems.map((d) => d.id));
    if (orderedIds.length !== dailyItems.length) throw new BadRequestException('orderedDailyItemIds must include every item in the selected day.');
    for (const id of orderedIds) {
      if (!existingIds.has(id)) throw new BadRequestException(`Daily item ${id} is not part of ${dto.date}.`);
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) => this.prisma.dailyItem.update({ where: { id }, data: { sortOrder: index } })),
    );
    return { success: true };
  }

  private async getNextSortOrder(userId: string, date: Date) {
    const latest = await this.prisma.dailyItem.findFirst({
      where: { userId, date, removedFromToday: false },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return (latest?.sortOrder ?? -1) + 1;
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
