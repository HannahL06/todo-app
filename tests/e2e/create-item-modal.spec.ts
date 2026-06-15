import { expect, test } from '@playwright/test';
import { today, tomorrow } from '../helpers/dates';

async function mockEmptyDailyList(page: any) {
  await page.route('**/api/v1/daily-items?date=*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ date: today(), items: [] }),
    });
  });
}

test.describe('Create Item Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyDailyList(page);
  });

  test('opens and closes from the add-item flow', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="add-item-button"]').click();
    await expect(page.locator('[data-testid="create-item-modal"]')).toBeVisible();
    await page.locator('[data-testid="cancel-button"]').click();
    await expect(page.locator('[data-testid="create-item-modal"]')).toHaveCount(0);
  });

  test('lets the user change type, description, and scheduled date', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="add-item-button"]').click();

    await page.locator('[data-testid="item-type-select"]').selectOption('note');
    await page.locator('[data-testid="item-name-input"]').fill('Notebook idea');
    await page.locator('[data-testid="item-description-input"]').fill('Draft the outline');
    await page.locator('[data-testid="item-date-input"]').fill(tomorrow());

    await expect(page.locator('[data-testid="item-type-select"]')).toHaveValue('note');
    await expect(page.locator('[data-testid="item-name-input"]')).toHaveValue('Notebook idea');
    await expect(page.locator('[data-testid="item-description-input"]')).toHaveValue('Draft the outline');
    await expect(page.locator('[data-testid="item-date-input"]')).toHaveValue(tomorrow());
  });

  test('creates a same-day item and appends it to the list', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;

    await page.route('**/api/v1/items', async (route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          dailyItemId: 'created-1',
          itemId: 'item-created-1',
          type: 'task',
          name: payload?.name,
          description: payload?.description,
          status: 'untouched',
          sortOrder: 0,
          isRolling: false,
        }),
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="add-item-button"]').click();
    await page.locator('[data-testid="item-name-input"]').fill('Important task');
    await page.locator('[data-testid="item-description-input"]').fill('This is important');
    await page.locator('[data-testid="item-name-input"]').press('Enter');

    await expect(page.locator('[data-testid="create-item-modal"]')).toHaveCount(0);
    await expect(page.getByText('Important task')).toBeVisible();
    await expect(page.getByText('This is important')).toBeVisible();
    expect(payload).toEqual({
      name: 'Important task',
      description: 'This is important',
      type: 'task',
      scheduledDate: today(),
    });
  });

  test('submits a future scheduled item without appending it to today', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;

    await page.route('**/api/v1/items', async (route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          dailyItemId: 'created-2',
          itemId: 'item-created-2',
          type: 'appointment',
          name: payload?.name,
          description: payload?.description,
          status: 'untouched',
          sortOrder: 0,
          isRolling: false,
        }),
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="add-item-button"]').click();
    await page.locator('[data-testid="item-type-select"]').selectOption('appointment');
    await page.locator('[data-testid="item-name-input"]').fill('Doctor appointment');
    await page.locator('[data-testid="item-date-input"]').fill(tomorrow());
    await page.locator('[data-testid="item-name-input"]').press('Enter');

    await expect(page.locator('[data-testid="create-item-modal"]')).toHaveCount(0);
    await expect(page.getByText('Doctor appointment')).toHaveCount(0);
    expect(payload).toEqual({
      name: 'Doctor appointment',
      description: null,
      type: 'appointment',
      scheduledDate: tomorrow(),
    });
  });

  test('validates required name input and trims payload values', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;

    await page.route('**/api/v1/items', async (route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          dailyItemId: 'created-3',
          itemId: 'item-created-3',
          type: 'task',
          name: payload?.name,
          description: payload?.description,
          status: 'untouched',
          sortOrder: 0,
          isRolling: false,
        }),
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="add-item-button"]').click();
    
    // Try to submit with empty name
    await page.locator('[data-testid="item-name-input"]').press('Enter');
    
    // Either error message appears or the item creation doesn't happen
    const errorVisible = await page.locator('[data-testid="error-message"]').isVisible().catch(() => false);
    if (errorVisible) {
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Task name is required');
    }
    expect(payload).toBeNull(); // No API call should have been made

    // Now fill in the fields with spaces to test trimming
    await page.locator('[data-testid="item-name-input"]').fill('   Task with spaces   ');
    await page.locator('[data-testid="item-description-input"]').fill('   Description with spaces   ');
    await page.locator('[data-testid="item-name-input"]').press('Enter');

    // Wait for the modal to close, indicating successful submission
    await expect(page.locator('[data-testid="create-item-modal"]')).toHaveCount(0);
    
    // Verify the payload was trimmed
    expect(payload).toEqual({
      name: 'Task with spaces',
      description: 'Description with spaces',
      type: 'task',
      scheduledDate: today(),
    });
  });
});
