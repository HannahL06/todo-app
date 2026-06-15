import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';

test.describe('Navigation - US-?: View Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [] }),
      });
    });
  });

  test('sidebar displays all view options', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Verify all navigation options exist
    const viewOptions = ['daily', 'calendar', 'lists', 'search', 'records'];
    for (const view of viewOptions) {
      const navItem = sidebar.locator(`[data-testid="nav-${view}"]`);
      await expect(navItem).toBeVisible();
    }
  });

  test('Daily view is active by default', async ({ page }) => {
    await page.goto('/');

    const dailyNav = page.locator('[data-testid="nav-daily"]');
    await expect(dailyNav).toHaveClass(/active/i);

    const dailyView = page.locator('[data-testid="daily-list-view"]');
    await expect(dailyView).toBeVisible();
  });

  test('clicking Calendar nav switches to calendar view', async ({ page }) => {
    await page.goto('/');

    const calendarNav = page.locator('[data-testid="nav-calendar"]');
    await calendarNav.click();

    await expect(calendarNav).toHaveClass(/active/i);

    const calendarView = page.locator('[data-testid="calendar-view"]');
    await expect(calendarView).toBeVisible();

    const dailyView = page.locator('[data-testid="daily-list-view"]');
    await expect(dailyView).not.toBeVisible();
  });

  test('clicking Lists nav switches to lists view', async ({ page }) => {
    await page.goto('/');

    const listsNav = page.locator('[data-testid="nav-lists"]');
    await listsNav.click();

    await expect(listsNav).toHaveClass(/active/i);

    const listsView = page.locator('[data-testid="lists-view"]');
    await expect(listsView).toBeVisible();
  });

  test('clicking Search nav switches to search view', async ({ page }) => {
    await page.goto('/');

    const searchNav = page.locator('[data-testid="nav-search"]');
    await searchNav.click();

    await expect(searchNav).toHaveClass(/active/i);

    const searchView = page.locator('[data-testid="search-view"]');
    await expect(searchView).toBeVisible();
  });

  test('clicking Records nav switches to records view', async ({ page }) => {
    await page.goto('/');

    const recordsNav = page.locator('[data-testid="nav-records"]');
    await recordsNav.click();

    await expect(recordsNav).toHaveClass(/active/i);

    const recordsView = page.locator('[data-testid="records-view"]');
    await expect(recordsView).toBeVisible();
  });

  test('can navigate between views multiple times', async ({ page }) => {
    await page.goto('/');

    const dailyNav = page.locator('[data-testid="nav-daily"]');
    const calendarNav = page.locator('[data-testid="nav-calendar"]');
    const listsNav = page.locator('[data-testid="nav-lists"]');

    // Daily → Calendar
    await calendarNav.click();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

    // Calendar → Lists
    await listsNav.click();
    await expect(page.locator('[data-testid="lists-view"]')).toBeVisible();

    // Lists → Daily
    await dailyNav.click();
    await expect(page.locator('[data-testid="daily-list-view"]')).toBeVisible();
  });
});

test.describe('Calendar View Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [] }),
      });
    });
  });

  test('calendar view displays current month', async ({ page }) => {
    await page.goto('/');

    const calendarNav = page.locator('[data-testid="nav-calendar"]');
    await calendarNav.click();

    const monthDisplay = page.locator('[data-testid="calendar-month"]');
    await expect(monthDisplay).toBeVisible();

    // Should show current month name
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    await expect(monthDisplay).toContainText(monthName);
  });
});

test.describe('Lists View Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [] }),
      });
    });
  });

  test('lists view displays list management interface', async ({ page }) => {
    await page.goto('/');

    const listsNav = page.locator('[data-testid="nav-lists"]');
    await listsNav.click();

    const listsView = page.locator('[data-testid="lists-view"]');
    await expect(listsView).toBeVisible();
  });
});

test.describe('Search View Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [] }),
      });
    });
  });

  test('search view displays search interface', async ({ page }) => {
    await page.goto('/');

    const searchNav = page.locator('[data-testid="nav-search"]');
    await searchNav.click();

    const searchView = page.locator('[data-testid="search-view"]');
    await expect(searchView).toBeVisible();

    const searchInput = searchView.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Records View Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/daily-items?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ date: today(), items: [] }),
      });
    });
  });

  test('records view displays completed items', async ({ page }) => {
    await page.goto('/');

    const recordsNav = page.locator('[data-testid="nav-records"]');
    await recordsNav.click();

    const recordsView = page.locator('[data-testid="records-view"]');
    await expect(recordsView).toBeVisible();
  });
});
