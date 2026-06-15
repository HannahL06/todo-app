# Todo App Playwright E2E Tests

Comprehensive end-to-end test suite for the Todo app using Playwright. These tests connect to the real backend server and validate the full user workflows.

## Project Structure

```
tests/
├── e2e/                           # End-to-end test files
│   ├── daily-list-view.spec.ts   # Tests for daily list display (US-01)
│   ├── create-item-modal.spec.ts # Tests for item creation modal (US-02, US-03)
│   ├── status-cycling.spec.ts    # Tests for status checkbox cycling (US-04)
│   ├── parent-completion-cascade.spec.ts  # Tests for nested tasks (US-05)
│   ├── drag-and-drop.spec.ts     # Tests for drag & drop reordering (US-06)
│   ├── navigation.spec.ts        # Tests for view navigation
├── helpers/                       # Test utilities and helpers
│   ├── dates.ts                  # Date formatting and navigation utilities
│   ├── api.ts                    # API helper functions
├── playwright.config.ts          # Playwright configuration
└── README.md                     # This file
```

## Prerequisites

1. **Node.js** (v16+)
2. **Playwright** - Already installed in the project
3. **Backend server** running on `http://localhost:3000`
4. **Frontend dev server** running on `http://127.0.0.1:5173`

## Installation

```bash
# Install dependencies (from project root)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run specific test file

```bash
npx playwright test tests/e2e/daily-list-view.spec.ts
```

### Run tests matching a pattern

```bash
npx playwright test -g "status cycling"
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### View test report

```bash
npx playwright show-report
```

## Test Coverage

### US-01: Daily List Opens to Today
- ✅ Display today's date by default
- ✅ Show correct day of week and date
- ✅ Display items for today only
- ✅ Show empty state when no items exist

### US-02 & US-03: Add Items Through Modal & Schedule Future Work
- ✅ Modal opens/closes correctly
- ✅ Select item types (task, note, appointment)
- ✅ Enter item name and description
- ✅ Select scheduled date
- ✅ Create items with all field combinations
- ✅ Validate required fields
- ✅ Trim whitespace from inputs
- ✅ Schedule items for future dates
- ✅ Default to today when date not specified

### US-04: Track Status by Checkbox Cycle
- ✅ Status cycles: untouched → in-progress → completed → untouched
- ✅ Status changes persist after page reload
- ✅ UI colors reflect status correctly
- ✅ Status changes are immediate in the UI
- ✅ Multiple items can have different statuses
- ✅ All item types can cycle status

### US-05: Parent Completion Cascades to Children
- ✅ Create nested tasks (parent and children)
- ✅ Completing parent marks all children as completed
- ✅ Completing parent doesn't affect sibling items
- ✅ Can indent/outdent tasks to create hierarchy
- ✅ Respects maximum nesting depth (7 levels)
- ✅ Child cannot exist without parent
- ✅ Modifying child status doesn't affect parent

### US-06: Reorder by Drag and Drop
- ✅ Drag and drop items to reorder
- ✅ Position updates immediately in UI
- ✅ Drag and drop order persists after page reload
- ✅ Can use drag handle if available
- ✅ Cannot drag items between different days
- ✅ Multiple drag operations maintain correct order

### Navigation & Views
- ✅ All view options display in sidebar
- ✅ Daily view is active by default
- ✅ Can switch between Calendar, Lists, Search, Records views
- ✅ Can navigate back to Daily view
- ✅ Calendar shows current month and can navigate months
- ✅ Search view displays search interface

## Test Data & Cleanup

Tests use the real backend API (`http://localhost:3000`). Each test:

1. **Creates fresh test data** via the API
2. **Runs in isolation** - multiple tests can run in parallel
3. **Uses today's date** by default for consistent testing

**Note:** Tests currently assume a fresh database or don't clean up between runs. For production CI/CD, consider:
- Adding test database setup/teardown
- Using database snapshots
- Adding cleanup endpoints

## API Helpers

The `tests/helpers/api.ts` file provides utilities for common operations:

```typescript
// Create a single item
const item = await createItem(request, {
  name: 'Task name',
  type: 'task',
  scheduledDate: today(),
});

// Get items for a date
const items = await getDailyItems(request, today());

// Cycle item status
await cycleItemStatus(request, item.dailyItemId);

// Create multiple items
const items = await createMultipleItems(request, [
  { name: 'Item 1', type: 'task', scheduledDate: today() },
  { name: 'Item 2', type: 'note', scheduledDate: tomorrow() },
]);
```

## Date Helpers

The `tests/helpers/dates.ts` file provides date utilities:

```typescript
import { today, tomorrow, daysFromNow, formatDate } from '../helpers/dates';

today();           // Returns today's date as YYYY-MM-DD
tomorrow();        // Returns tomorrow's date as YYYY-MM-DD
daysFromNow(7);    // Returns date 7 days from now as YYYY-MM-DD
formatDate(new Date());  // Formats any date to YYYY-MM-DD
```

## Common Test Patterns

### Testing Item Creation

```typescript
await page.goto('/');
const addButton = page.locator('[data-testid="add-item-button"]');
await addButton.click();

await page.locator('[data-testid="item-name-input"]').fill('Task name');
await page.locator('[data-testid="create-button"]').click();

await expect(page.getByText('Task name')).toBeVisible();
```

### Testing Status Cycling

```typescript
const itemRow = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Task' });
const checkbox = itemRow.locator('[data-testid="status-checkbox"]');

await checkbox.click();
await expect(itemRow).toHaveAttribute('data-status', 'in-progress');
```

### Testing Drag and Drop

```typescript
const item1 = page.locator('[data-testid="daily-item"]').filter({ hasText: 'First' });
const item2 = page.locator('[data-testid="daily-item"]').filter({ hasText: 'Second' });

await item1.dragTo(item2);
```

## Debugging

### Enable verbose logging

```bash
PWDEBUG=1 npx playwright test
```

### Generate trace for failed tests

Tests automatically generate traces on first retry. View with:

```bash
npx playwright show-report
```

### Step through tests interactively

```bash
npx playwright test --debug
```

### Use inspector

```bash
PWDEBUG=console npx playwright test
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Adding New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Import test utilities from `../helpers/`
3. Use descriptive test names following the pattern: `test.describe('Feature - US-XX', () => { ... })`
4. Use data-testid attributes for reliable element selection

Example:

```typescript
import { expect, test } from '@playwright/test';
import { today } from '../helpers/dates';
import { createItem } from '../helpers/api';

test.describe('New Feature - US-XX', () => {
  test('should do something', async ({ page, request }) => {
    await createItem(request, {
      name: 'Test item',
      type: 'task',
      scheduledDate: today(),
    });

    await page.goto('/');
    await expect(page.getByText('Test item')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests fail with "Connection refused"

- Ensure backend server is running on `http://localhost:3000`
- Ensure frontend dev server is running on `http://127.0.0.1:5173`

### Tests fail with "Timeout waiting for webServer"

- Frontend might not be starting correctly
- Check `npm run dev` works properly
- Increase timeout in `playwright.config.ts` if needed

### Tests timeout on drag and drop

- Some drag and drop operations may need longer timeouts
- Add `.setTimeout(30000)` to individual test if needed

### Missing data-testid attributes

- Components need `data-testid` attributes for reliable selection
- Update selectors if component structure changes
- Avoid relying on text content alone for element selection

## Links

- [Playwright Documentation](https://playwright.dev/)
- [User Stories](../docs/Specs.md/user-stories.md)
- [API Design](../docs/Specs.md/api-design.md)
- [Data Model](../docs/Specs.md/data-model.md)
