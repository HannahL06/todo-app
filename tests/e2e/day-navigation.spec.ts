import { expect, test } from '@playwright/test';
import { daysFromNow, today, tomorrow } from '../helpers/dates';

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function mockDailyItems(page: import('@playwright/test').Page, date: string, items = []) {
  return page.route(`**/api/v1/daily-items?date=${date}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ date, items }),
    });
  });
}

test.describe('Day Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // mock all date requests
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      const url = route.request().url();
      const date = new URL(url).searchParams.get('date') ?? today();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date, items: [] }),
      });
    });
  });

  test('shows today by default with no Back-to-Today button', async ({ page }) => {
    await page.goto('/');

    const dateHeader = page.locator('[data-testid="date-header"]');
    await expect(dateHeader).toHaveText(today());

    const todayButton = page.locator('[data-testid="today-button"]');
    await expect(todayButton).not.toBeVisible();
  });

  test('next-day button advances the date by one day', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="next-day-button"]').click();

    const dateHeader = page.locator('[data-testid="date-header"]');
    await expect(dateHeader).toHaveText(tomorrow());

    const dateDisplay = page.locator('[data-testid="date-display"]');
    await expect(dateDisplay).toContainText(formatDateHeader(tomorrow()));
  });

  test('prev-day button goes back one day', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="prev-day-button"]').click();

    const dateHeader = page.locator('[data-testid="date-header"]');
    await expect(dateHeader).toHaveText(daysFromNow(-1));
  });

  test('Back-to-Today button appears when not on today', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="next-day-button"]').click();

    const todayButton = page.locator('[data-testid="today-button"]');
    await expect(todayButton).toBeVisible();
  });

  test('Back-to-Today button returns to today and hides itself', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="next-day-button"]').click();
    await page.locator('[data-testid="next-day-button"]').click();

    const dateHeader = page.locator('[data-testid="date-header"]');
    await expect(dateHeader).toHaveText(daysFromNow(2));

    await page.locator('[data-testid="today-button"]').click();

    await expect(dateHeader).toHaveText(today());
    await expect(page.locator('[data-testid="today-button"]')).not.toBeVisible();
  });

  test('empty state message differs for today vs other days', async ({ page }) => {
    await page.goto('/');

    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toContainText('Start by creating');

    await page.locator('[data-testid="next-day-button"]').click();
    await expect(emptyState).toContainText('Nothing scheduled');
  });
});
