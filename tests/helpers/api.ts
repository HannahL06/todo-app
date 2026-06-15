import { APIRequestContext } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface CreateItemPayload {
  name: string;
  description?: string | null;
  type?: 'task' | 'note' | 'appointment';
  scheduledDate: string;
}

export interface DailyItem {
  dailyItemId: string;
  itemId: string;
  type: 'task' | 'note' | 'appointment';
  name: string;
  description: string | null;
  status: 'untouched' | 'in_progress' | 'completed';
  sortOrder: number;
  isRolling: boolean;
}

export interface DailyItemsResponse {
  date: string;
  items: DailyItem[];
}

/**
 * Create an item via the API
 */
export async function createItem(
  request: APIRequestContext,
  payload: CreateItemPayload
): Promise<DailyItem> {
  const response = await request.post(`${API_BASE_URL}/items`, {
    data: {
      type: payload.type ?? 'task',
      ...payload,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create item: ${response.status()}`);
  }

  return response.json() as Promise<DailyItem>;
}

/**
 * Get items for a specific date
 */
export async function getDailyItems(
  request: APIRequestContext,
  date: string
): Promise<DailyItemsResponse> {
  const response = await request.get(`${API_BASE_URL}/daily-items`, {
    params: { date },
  });

  if (!response.ok()) {
    throw new Error(`Failed to fetch daily items: ${response.status()}`);
  }

  return response.json() as Promise<DailyItemsResponse>;
}

/**
 * Cycle the status of a daily item
 */
export async function cycleItemStatus(
  request: APIRequestContext,
  dailyItemId: string
): Promise<DailyItem> {
  const response = await request.post(`${API_BASE_URL}/daily-items/${dailyItemId}/cycle-status`);

  if (!response.ok()) {
    throw new Error(`Failed to cycle status: ${response.status()}`);
  }

  return response.json() as Promise<DailyItem>;
}

/**
 * Create multiple items at once (helper)
 */
export async function createMultipleItems(
  request: APIRequestContext,
  items: CreateItemPayload[]
): Promise<DailyItem[]> {
  return Promise.all(items.map((item) => createItem(request, item)));
}

/**
 * Clear all items for a date (creates fresh state for testing)
 */
export async function clearDailyItems(
  request: APIRequestContext,
  date: string
): Promise<void> {
  const response = await getDailyItems(request, date);

  // In a real scenario, you might have a delete endpoint
  // For now, this is a helper to document the intent
  // You may need to implement a cleanup endpoint or use database directly
  console.log(`Items on ${date}:`, response.items.length);
}
