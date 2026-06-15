import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';

async function mockDailyItems(page: any, items: Array<Record<string, unknown>>) {
  await page.route('**/api/v1/daily-items?date=*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: today(),
        items,
      }),
    });
  });
}

function currentDateDisplay() {
  return new Date(`${today()}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

test.describe('Daily List View', () => {
  test('displays today date by default', async ({ page }) => {
    await mockDailyItems(page, []);
    await page.goto('/');

    await expect(page.locator('[data-testid="daily-list-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-header"]')).toContainText(today());
    await expect(page.locator('[data-testid="date-display"]')).toHaveText(currentDateDisplay());
  });

  test('renders daily items from the API response', async ({ page }) => {
    await mockDailyItems(page, [
      {
        dailyItemId: 'task-1',
        itemId: 'item-1',
        type: 'task',
        name: 'Pay rent',
        description: 'Monthly rent due',
        status: 'untouched',
        sortOrder: 0,
        isRolling: false,
      },
      {
        dailyItemId: 'note-1',
        itemId: 'item-2',
        type: 'note',
        name: 'Journal prompt',
        description: 'Write three wins from today',
        status: 'completed',
        sortOrder: 1,
        isRolling: false,
      },
    ]);

    await page.goto('/');

    const items = page.locator('[data-testid="daily-item"]');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveAttribute('data-type', 'task');
    await expect(items.nth(0)).toContainText('Pay rent');
    await expect(items.nth(1)).toHaveAttribute('data-type', 'note');
    await expect(items.nth(1)).toContainText('Journal prompt');
  });

  test('keeps API sort order in the rendered list', async ({ page }) => {
    await mockDailyItems(page, [
      {
        dailyItemId: 'task-1',
        itemId: 'item-1',
        type: 'task',
        name: 'First task',
        description: null,
        status: 'untouched',
        sortOrder: 0,
        isRolling: false,
      },
      {
        dailyItemId: 'task-2',
        itemId: 'item-2',
        type: 'task',
        name: 'Second task',
        description: null,
        status: 'in-progress',
        sortOrder: 1,
        isRolling: false,
      },
      {
        dailyItemId: 'task-3',
        itemId: 'item-3',
        type: 'task',
        name: 'Third task',
        description: null,
        status: 'completed',
        sortOrder: 2,
        isRolling: false,
      },
    ]);

    await page.goto('/');

    const items = page.locator('[data-testid="daily-item"]');
    await expect(items.nth(0)).toContainText('First task');
    await expect(items.nth(1)).toContainText('Second task');
    await expect(items.nth(2)).toContainText('Third task');
  });

  test('shows an empty state when the API returns no items', async ({ page }) => {
    await mockDailyItems(page, []);
    await page.goto('/');

    await expect(page.locator('[data-testid="empty-state"]')).toContainText('Start by creating');
  });
});
