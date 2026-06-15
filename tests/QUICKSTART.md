# Getting Started with Playwright Tests

Quick setup guide to run your new test suite.

## Prerequisites

Make sure you have:
- Node.js 16 or higher installed
- Backend server running (or ready to start)
- Frontend dev server capability

## 1️⃣ Install Dependencies (First Time Only)

```bash
# From project root
npm install

# Install Playwright browsers
npx playwright install
```

## 2️⃣ Start the Servers

You need both backend and frontend running:

### Terminal 1 - Backend Server
```bash
cd server
npm install  # if not done yet
npm run start
# Server runs on http://localhost:3000
```

### Terminal 2 - Frontend Dev Server
```bash
cd client
npm install  # if not done yet
npm run dev
# Frontend runs on http://127.0.0.1:5173
```

**Or from root** (if using workspace setup):
```bash
npm run dev
# Starts both servers concurrently
```

## 3️⃣ Run Tests

Once servers are running, open a new terminal:

### Run all tests
```bash
npm run test:e2e
```

### Run with UI (interactive - recommended for first run)
```bash
npm run test:e2e:ui
```
This opens an interactive dashboard where you can:
- Run individual tests
- See live browser interaction
- Debug failing tests
- View detailed results

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run debug mode (step through)
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector where you can:
- Step through code
- Inspect elements
- Set breakpoints
- Evaluate expressions

### Run specific test file
```bash
npx playwright test tests/e2e/status-cycling.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "daily list"
```

## 4️⃣ View Results

After tests run:

```bash
npx playwright show-report
```

This opens an HTML report with:
- Summary of passed/failed tests
- Screenshots for failures
- Video recordings (if enabled)
- Detailed traces

## 📋 Test Organization

Tests are organized by feature:

| File | Tests | Focus |
|------|-------|-------|
| `daily-list-view.spec.ts` | 6 | Displaying today's tasks |
| `create-item-modal.spec.ts` | 11 | Creating new items |
| `status-cycling.spec.ts` | 6 | Status changes (checkbox) |
| `navigation.spec.ts` | 10 | Switching between views |
| `drag-and-drop.spec.ts` | 6 | Reordering items |
| `parent-completion-cascade.spec.ts` | 8 | Nested tasks |

**Total: 47 tests**

## ⚠️ Important: Update Component Data-TestIds

Tests require `data-testid` attributes in your React components. For example:

```tsx
// Daily list item
<div data-testid="daily-item" data-status="untouched">
  <input data-testid="status-checkbox" type="checkbox" />
  <span data-testid="status-badge">untouched</span>
</div>

// Modal
<div data-testid="create-item-modal">
  <input data-testid="item-name-input" />
  <input data-testid="item-date-input" />
  <button data-testid="create-button">Create</button>
</div>
```

**See [tests/README.md](tests/README.md)** for complete list of expected `data-testid` attributes.

## 🐛 If Tests Fail

### "Connection refused" errors
- ✅ Ensure backend runs on `http://localhost:3000`
- ✅ Ensure frontend runs on `http://127.0.0.1:5173`

### "Element not found" errors
- ✅ Component is missing `data-testid` attribute
- ✅ Add the attribute to the component
- ✅ Restart servers and re-run tests

### Timeout errors
- ✅ Increase timeout in `playwright.config.ts` if needed
- ✅ Check if components are loading slowly
- ✅ Check network tab in browser DevTools

### Status/order not persisting
- ✅ Verify backend API endpoints are implemented:
  - `POST /api/v1/items` - Create item
  - `GET /api/v1/daily-items?date=YYYY-MM-DD` - Fetch items
  - `POST /api/v1/daily-items/{id}/cycle-status` - Cycle status
- ✅ Check database is persisting changes

## 📖 More Information

- **Full test documentation**: [tests/README.md](tests/README.md)
- **Test summary**: [TESTS.md](TESTS.md)
- **User stories**: [docs/Specs.md/user-stories.md](docs/Specs.md/user-stories.md)

## 🚀 Common Workflows

### Quick smoke test
```bash
npm run test:e2e:chromium -- -g "daily list"
```

### Full suite on all browsers
```bash
npm run test:e2e
```

### Debug a specific failing test
```bash
npm run test:e2e:debug -- tests/e2e/status-cycling.spec.ts
```

### Watch mode (auto-rerun on file changes)
```bash
npm run test:e2e -- --watch
```

## 💡 Pro Tips

1. **Use UI mode for development**: `npm run test:e2e:ui` is great for developing new tests
2. **Add `--headed` flag** to see the browser interact with your app
3. **Use `--debug`** when tests fail to understand what went wrong
4. **Check the HTML report** for detailed results: `npx playwright show-report`
5. **Run a single test file** when developing to save time: `npx playwright test daily-list-view.spec.ts`

## ❓ Need Help?

Check these resources:
- [Playwright Documentation](https://playwright.dev/)
- [Test README](tests/README.md)
- [Test Summary](TESTS.md)

Happy testing! 🎉
