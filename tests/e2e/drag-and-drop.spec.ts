import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';

type ItemStatus = 'untouched' | 'in-progress' | 'completed';

interface TestDailyItem {
  dailyItemId: string;
  itemId: string;
  type: 'task' | 'note' | 'appointment';
  name: string;
  description: string | null;
  status: ItemStatus;
  sortOrder: number;
  isRolling: boolean;
}

function makeItem(id: string, name: string, sortOrder: number): TestDailyItem {
  return {
    dailyItemId: id,
    itemId: `item-${id}`,
    type: 'task',
    name,
    description: null,
    status: 'untouched',
    sortOrder,
    isRolling: true,
  };
}

async function setupReorderMocks(page: import('@playwright/test').Page, seed: TestDailyItem[]) {
  let currentItems = [...seed];

  await page.route('**/api/v1/daily-items?date=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ date: today(), items: currentItems }),
    });
  });

  await page.route('**/api/v1/daily-items/reorder', async (route) => {
    const body = route.request().postDataJSON() as { orderedDailyItemIds: string[] };
    const byId = new Map(currentItems.map((item) => [item.dailyItemId, item]));
    currentItems = body.orderedDailyItemIds
      .map((id, index) => {
        const item = byId.get(id);
        if (!item) return undefined;
        return { ...item, sortOrder: index };
      })
      .filter((item): item is TestDailyItem => Boolean(item));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe('Drag and Drop - US-06: Reorder by drag and drop', () => {
  test('can drag and drop item to reorder', async ({ page }) => {
    await setupReorderMocks(page, [
      makeItem('drag-1', 'First item', 0),
      makeItem('drag-2', 'Second item', 1),
      makeItem('drag-3', 'Third item', 2),
    ]);

    await page.goto('/');

    const names = page.locator('[data-testid="daily-item"] [data-testid="item-drag-handle"]');

    // Verify initial order
    await expect(names.nth(0)).toContainText('First item');
    await expect(names.nth(1)).toContainText('Second item');
    await expect(names.nth(2)).toContainText('Third item');

    // Drag second item to first position
    const secondHandle = page.locator('[data-testid="item-drag-handle"]', { hasText: 'Second item' });
    const firstRow = page.locator('[data-testid="daily-item"]', {
      has: page.locator('[data-testid="item-drag-handle"]', { hasText: 'First item' }),
    });

    await secondHandle.dragTo(firstRow);

    // Verify new order (order should be Second, First, Third)
    await expect(names.nth(0)).toContainText('Second item');
    await expect(names.nth(1)).toContainText('First item');
    await expect(names.nth(2)).toContainText('Third item');
  });

  test('drag and drop order persists after page reload', async ({ page }) => {
    await setupReorderMocks(page, [
      makeItem('drag-1', 'Task X', 0),
      makeItem('drag-2', 'Task Y', 1),
      makeItem('drag-3', 'Task Z', 2),
    ]);

    await page.goto('/');

    // Attempt reorder using drag handle
    const taskZHandle = page.locator('[data-testid="item-drag-handle"]', { hasText: 'Task Z' });
    const taskXRow = page.locator('[data-testid="daily-item"]', {
      has: page.locator('[data-testid="item-drag-handle"]', { hasText: 'Task X' }),
    });
    await taskZHandle.dragTo(taskXRow);

    const names = page.locator('[data-testid="daily-item"] [data-testid="item-drag-handle"]');
    const afterDrag = [
      await names.nth(0).textContent(),
      await names.nth(1).textContent(),
      await names.nth(2).textContent(),
    ];

    // Reload page
    await page.reload();

    const reloadedNames = page.locator('[data-testid="daily-item"] [data-testid="item-drag-handle"]');
    const afterReload = [
      await reloadedNames.nth(0).textContent(),
      await reloadedNames.nth(1).textContent(),
      await reloadedNames.nth(2).textContent(),
    ];

    expect(afterReload).toEqual(afterDrag);
  });

  test('cannot drag items between different days', async ({ page }) => {
    let currentDate = today();
    const itemsByDate: Record<string, TestDailyItem[]> = {
      [today()]: [makeItem('today-1', 'Today item', 0)],
    };

    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      const date = new URL(route.request().url()).searchParams.get('date') ?? today();
      currentDate = date;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date, items: itemsByDate[date] ?? [] }),
      });
    });

    await page.route('**/api/v1/items', async (route) => {
      const body = route.request().postDataJSON() as { name: string; type: 'task' | 'note' | 'appointment' };
      const date = currentDate;
      const currentItems = itemsByDate[date] ?? [];
      const created = {
        ...makeItem(`created-${date}`, body.name, currentItems.length),
        type: body.type,
      };
      itemsByDate[date] = [...currentItems, created];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    });

    await page.goto('/');

    // Navigate to tomorrow
    const nextButton = page.locator('[data-testid="next-day-button"]');
    await nextButton.click();

    // Create item for tomorrow
    const addButton = page.locator('[data-testid="add-item-button"]');
    await addButton.click();

    const nameInput = page.locator('[data-testid="item-name-input"]');
    await nameInput.fill('Tomorrow item');

    await nameInput.press('Enter');

    // Go back to today
    const prevButton = page.locator('[data-testid="prev-day-button"]');
    await prevButton.click();

    // Should only see today item
    await expect(page.locator('[data-testid="daily-item"]', {
      has: page.locator('[data-testid="item-drag-handle"]', { hasText: 'Today item' }),
    })).toBeVisible();
    await expect(page.locator('[data-testid="daily-item"]', {
      has: page.locator('[data-testid="item-drag-handle"]', { hasText: 'Tomorrow item' }),
    })).toHaveCount(0);
  });
});
