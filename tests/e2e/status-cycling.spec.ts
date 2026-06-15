import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';

type Status = 'untouched' | 'in-progress' | 'completed';

function buildItem(status: Status) {
  return {
    dailyItemId: 'status-item-1',
    itemId: 'item-1',
    type: 'task',
    name: 'Status cycle test',
    description: 'Track this task',
    status,
    sortOrder: 0,
    isRolling: false,
  };
}

test.describe('Status Cycling', () => {
  test('cycles untouched to in-progress to completed to untouched', async ({ page }) => {
    let currentStatus: Status = 'untouched';

    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [buildItem(currentStatus)] }),
      });
    });

    await page.route('**/api/v1/daily-items/status-item-1/cycle-status', async (route) => {
      currentStatus =
        currentStatus === 'untouched'
          ? 'in-progress'
          : currentStatus === 'in-progress'
            ? 'completed'
            : 'untouched';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildItem(currentStatus)),
      });
    });

    await page.goto('/');

    const itemRow = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Status cycle test' });
    const statusControl = itemRow.locator('[data-testid="status-badge"]');
    const statusBadge = itemRow.locator('[data-testid="status-badge"]');

    await expect(itemRow).toHaveAttribute('data-status', 'untouched');
    await expect(statusBadge).toContainText('untouched');

    await statusControl.click();
    await expect(itemRow).toHaveAttribute('data-status', 'in-progress');
    await expect(statusBadge).toContainText('in-progress');

    await statusControl.click();
    await expect(itemRow).toHaveAttribute('data-status', 'completed');
    await expect(statusBadge).toContainText('completed');

    await statusControl.click();
    await expect(itemRow).toHaveAttribute('data-status', 'untouched');
  });

  test('keeps the status badge classes in sync', async ({ page }) => {
    let currentStatus: Status = 'untouched';

    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [buildItem(currentStatus)] }),
      });
    });

    await page.route('**/api/v1/daily-items/status-item-1/cycle-status', async (route) => {
      currentStatus = currentStatus === 'untouched' ? 'in-progress' : 'completed';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildItem(currentStatus)),
      });
    });

    await page.goto('/');

    const itemRow = page.locator('[data-testid="daily-item"]');
    const statusControl = itemRow.locator('[data-testid="status-badge"]');
    const statusBadge = itemRow.locator('[data-testid="status-badge"]');

    await expect(statusBadge).toHaveClass(/status-incomplete/);
    await statusControl.click();
    await expect(statusBadge).toHaveClass(/status-in-progress/);
    await statusControl.click();
    await expect(statusBadge).toHaveClass(/status-completed/);
  });

  test('persists the latest status after a reload', async ({ page }) => {
    let currentStatus: Status = 'untouched';

    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [buildItem(currentStatus)] }),
      });
    });

    await page.route('**/api/v1/daily-items/status-item-1/cycle-status', async (route) => {
      currentStatus = 'in-progress';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildItem(currentStatus)),
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="status-badge"]').click();
    await page.reload();

    await expect(page.locator('[data-testid="daily-item"]')).toHaveAttribute('data-status', 'in-progress');
  });
});
