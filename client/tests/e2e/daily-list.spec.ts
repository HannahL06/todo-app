import { expect, test } from '@playwright/test';

test('renders daily list from API response', async ({ page }) => {
  await page.route('**/api/v1/daily-items?date=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-06-12',
        items: [
          {
            dailyItemId: 'd1',
            itemId: 'i1',
            type: 'task',
            name: 'Pay rent',
            description: 'Due today',
            status: 'completed',
            sortOrder: 0,
            isRolling: true,
          },
        ],
      }),
    });
  });

  await page.goto('/');

  await expect(page.getByText('Pay rent')).toBeVisible();
  await expect(page.getByText('completed')).toBeVisible();
});

test('creates a note from modal and sends expected payload', async ({ page }) => {
  let capturedCreatePayload: Record<string, unknown> | null = null;

  await page.route('**/api/v1/daily-items?date=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-06-12',
        items: [],
      }),
    });
  });

  await page.route('**/api/v1/items', async (route) => {
    capturedCreatePayload = route.request().postDataJSON() as Record<string, unknown>;

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        dailyItemId: 'd2',
        itemId: 'i2',
        type: 'note',
        name: capturedCreatePayload?.name,
        description: capturedCreatePayload?.description,
        status: 'untouched',
        sortOrder: 0,
        isRolling: true,
      }),
    });
  });

  await page.goto('/');

  await page.locator('button[title="Create new item"]').click();
  await page.locator('select.form-select').selectOption('note');
  await page.locator('input[placeholder="Enter task name"]').fill('Notebook idea');
  await page.locator('textarea[placeholder="Add details (optional)"]').fill('Draft chapter outline');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Notebook idea')).toBeVisible();
  await expect(page.getByText('untouched')).toBeVisible();
  expect(capturedCreatePayload).toEqual({
    name: 'Notebook idea',
    description: 'Draft chapter outline',
    type: 'note',
    scheduledDate: expect.any(String),
  });
});

test('cycles item status', async ({ page }) => {
  await page.route('**/api/v1/daily-items?date=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-06-12',
        items: [
          {
            dailyItemId: 'd3',
            itemId: 'i3',
            type: 'task',
            name: 'Status test',
            description: null,
            status: 'untouched',
            sortOrder: 0,
            isRolling: true,
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/daily-items/d3/cycle-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        dailyItemId: 'd3',
        itemId: 'i3',
        type: 'task',
        name: 'Status test',
        description: null,
        status: 'in-progress',
        sortOrder: 0,
        isRolling: true,
      }),
    });
  });

  await page.goto('/');

  await page.locator('[title="Click to cycle status: untouched"]').click();
  await expect(page.getByText('in-progress')).toBeVisible();
});
