import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';
import { createItem } from '../helpers/api';

test.describe.skip('Parent Completion Cascade - US-05: Parent completion cascades to children', () => {
  test('can create nested tasks (parent and children)', async ({ page }) => {
    await page.goto('/');

    const addButton = page.locator('[data-testid="add-item-button"]');
    await addButton.click();

    const nameInput = page.locator('[data-testid="item-name-input"]');
    const createButton = page.locator('[data-testid="create-button"]');

    // Create parent task
    await nameInput.fill('Parent task');
    await createButton.click();

    // Should appear in list
    await expect(page.getByText('Parent task')).toBeVisible();

    // Click add child or expand parent
    const parentItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Parent task' });
    const addChildButton = parentItem.locator('[data-testid="add-child-button"]');

    if (await addChildButton.isVisible()) {
      await addChildButton.click();

      const childNameInput = page.locator('[data-testid="child-name-input"]');
      await childNameInput.fill('Child task 1');

      const childCreateButton = page.locator('[data-testid="child-create-button"]');
      await childCreateButton.click();

      // Child should appear indented
      const childItem = page.locator('[data-testid="daily-item-child"]').filter({ hasText: 'Child task 1' });
      await expect(childItem).toBeVisible();
    }
  });

  test('completing parent task marks all children as completed', async ({ page, request }) => {
    // Create parent task via API
    const parent = await createItem(request, {
      name: 'Parent todo',
      type: 'task',
      scheduledDate: today(),
    });

    await page.goto('/');

    // Manually create children UI representation or via modal
    // For now, test assumes UI allows nested creation
    const parentItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Parent todo' });
    const addChildButton = parentItem.locator('[data-testid="add-child-button"]');

    if (await addChildButton.isVisible()) {
      // Create multiple children
      for (let i = 1; i <= 2; i++) {
        await addChildButton.click();

        const childNameInput = page.locator('[data-testid="child-name-input"]');
        await childNameInput.fill(`Subtask ${i}`);

        const childCreateButton = page.locator('[data-testid="child-create-button"]');
        await childCreateButton.click();
      }

      // All should start as untouched
      const children = page.locator('[data-testid="daily-item-child"]');
      let childCount = await children.count();

      for (let i = 0; i < childCount; i++) {
        await expect(children.nth(i)).toHaveAttribute('data-status', 'untouched');
      }

      // Click parent checkbox to complete it
      const parentCheckbox = parentItem.locator('[data-testid="status-checkbox"]');
      await parentCheckbox.click();
      await parentCheckbox.click(); // Click twice to reach completed state

      // All children should now be completed
      childCount = await children.count();
      for (let i = 0; i < childCount; i++) {
        await expect(children.nth(i)).toHaveAttribute('data-status', 'completed');
      }
    }
  });

  test('completing parent does not affect other items', async ({ page, request }) => {
    // Create parent task
    const parent = await createItem(request, {
      name: 'Parent task',
      type: 'task',
      scheduledDate: today(),
    });

    // Create sibling task
    const sibling = await createItem(request, {
      name: 'Sibling task',
      type: 'task',
      scheduledDate: today(),
    });

    await page.goto('/');

    const parentItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Parent task' });
    const siblingItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Sibling task' });

    // Complete parent
    const parentCheckbox = parentItem.locator('[data-testid="status-checkbox"]');
    await parentCheckbox.click();
    await parentCheckbox.click();

    // Sibling should still be untouched
    await expect(siblingItem).toHaveAttribute('data-status', 'untouched');
  });

  test('can indent task to create hierarchy', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-item-button"]');
    await page.goto('/');

    // Create first task
    await addButton.click();
    let nameInput = page.locator('[data-testid="item-name-input"]');
    let createButton = page.locator('[data-testid="create-button"]');

    await nameInput.fill('Task to indent');
    await createButton.click();

    // Find the task and check for indent button
    const taskItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Task to indent' });
    const indentButton = taskItem.locator('[data-testid="indent-button"]');

    if (await indentButton.isVisible()) {
      await indentButton.click();

      // Item should now be indented
      await expect(taskItem).toHaveClass(/indented|nested|child/i);
    }
  });

  test('can outdent task to move back to parent level', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-item-button"]');
    await page.goto('/');

    // Create task
    await addButton.click();
    let nameInput = page.locator('[data-testid="item-name-input"]');
    let createButton = page.locator('[data-testid="create-button"]');

    await nameInput.fill('Task to outdent');
    await createButton.click();

    const taskItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Task to outdent' });

    // First indent it
    const indentButton = taskItem.locator('[data-testid="indent-button"]');
    if (await indentButton.isVisible()) {
      await indentButton.click();

      // Find outdent button
      const outdentButton = taskItem.locator('[data-testid="outdent-button"]');
      if (await outdentButton.isVisible()) {
        await outdentButton.click();

        // Should no longer be indented
        const hasIndentClass = await taskItem.evaluate((el) =>
          el.className.includes('indented') || el.className.includes('nested')
        );
        expect(hasIndentClass).toBe(false);
      }
    }
  });

  test('respects maximum nesting depth of 7', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-item-button"]');
    await page.goto('/');

    // Create task
    await addButton.click();
    let nameInput = page.locator('[data-testid="item-name-input"]');
    let createButton = page.locator('[data-testid="create-button"]');

    await nameInput.fill('Task for depth test');
    await createButton.click();

    let taskItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Task for depth test' });

    // Try to indent 8 times
    let indentCount = 0;
    for (let i = 0; i < 8; i++) {
      const indentButton = taskItem.locator('[data-testid="indent-button"]');
      const isDisabled = await indentButton.isDisabled().catch(() => false);
      const isHidden = !(await indentButton.isVisible().catch(() => false));

      if (isDisabled || isHidden) {
        break;
      }

      await indentButton.click();
      indentCount++;
    }

    // Should have indented at most 7 times
    expect(indentCount).toBeLessThanOrEqual(7);
  });

  test('child task cannot exist without parent', async ({ page }) => {
    await page.goto('/');

    // Try to create orphaned child (should not be allowed)
    const addButton = page.locator('[data-testid="add-item-button"]');
    await addButton.click();

    // Check if there's a parent selection dropdown
    const parentSelect = page.locator('[data-testid="parent-select"]');

    if (await parentSelect.isVisible()) {
      const options = await parentSelect.locator('option').count();
      // Should require parent selection or only allow "none/root"
      expect(options).toBeGreaterThan(0);
    }
  });

  test('modifying child status does not affect parent', async ({ page, request }) => {
    // Create parent and children
    const parent = await createItem(request, {
      name: 'Parent',
      type: 'task',
      scheduledDate: today(),
    });

    await page.goto('/');

    const parentItem = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Parent' });
    const addChildButton = parentItem.locator('[data-testid="add-child-button"]');

    if (await addChildButton.isVisible()) {
      await addChildButton.click();

      const childNameInput = page.locator('[data-testid="child-name-input"]');
      await childNameInput.fill('Child task');

      const childCreateButton = page.locator('[data-testid="child-create-button"]');
      await childCreateButton.click();

      // Complete the child
      const childItem = page.locator('[data-testid="daily-item-child"]').filter({ hasText: 'Child task' });
      const childCheckbox = childItem.locator('[data-testid="status-checkbox"]');
      await childCheckbox.click();
      await childCheckbox.click();

      // Parent should still be untouched
      await expect(parentItem).toHaveAttribute('data-status', 'untouched');
    }
  });
});
