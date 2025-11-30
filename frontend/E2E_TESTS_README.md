# E2E Tests Guide

This document explains the E2E test setup and how to run different types of tests.

## Test Types

### Unit/Integration Tests (Vitest)
Located in: `__tests__/`, `lib/**/__tests__/`, `components/**/__tests__/`

Run with:
```bash
npm test                  # Run in watch mode
npm test -- --run         # Run once
npm run test:coverage     # Run with coverage
```

**Status**: ✅ All 73 tests passing

### E2E Tests (Playwright)
Located in: `e2e/`

#### Standard E2E Tests
Tests that use mocked APIs and don't require real backend data.

Run with:
```bash
npm run test:e2e          # Run all non-integration tests
npm run test:e2e:ui       # Run with UI mode
npm run test:e2e:headed   # Run in headed mode (visible browser)
```

**Included tests:**
- `home-page.spec.ts` - Home page navigation and display
- `teacher-registration.spec.ts` - Teacher registration flow
- `non-teacher-registration.spec.ts` - Non-teacher registration flow

**Status**: ✅ All 36 tests passing (across 3 browsers)

#### Integration Tests (@integration)
Tests that require:
- Real backend services running (localhost:3000)
- Actual task data in Firestore
- Real task generation (costs API credits)

Run with:
```bash
RUN_INTEGRATION_TESTS=true npm run test:e2e
```

**Included tests:**
- `task-creator.spec.ts` - Task generation flow (requires auth + backend)
- `tasks-page.spec.ts` - Task browsing (requires published tasks in DB)
- `task-detail.spec.ts` - Task detail view (requires published tasks in DB)

**Note**: These tests are skipped by default to avoid:
- Unnecessary API costs for task generation
- Dependence on specific database state
- Longer test execution times

## Page Objects

E2E tests use the Page Object Model pattern for better maintainability:

- `e2e/pages/registration.page.ts` - Registration modal interactions
- `e2e/pages/task-creator.page.ts` - Task creator page interactions
- `e2e/pages/tasks.page.ts` - Tasks browse page interactions
- `e2e/pages/task-detail.page.ts` - Task detail page interactions

## Test Fixtures

Located in: `e2e/fixtures/`

- `test-fixtures.ts` - Custom fixtures with page objects
- `api-mocks.ts` - API mocking helpers for registration flow

## Configuration

- `vitest.config.ts` - Unit test configuration (excludes e2e/)
- `playwright.config.ts` - E2E test configuration (excludes @integration by default)

## Writing New Tests

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@/lib/test-utils'; // Use custom render with providers

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    // assertions
  });
});
```

### E2E Tests (Standard)
```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page, registrationPage }) => {
    await registrationPage.goto();
    // test steps
  });
});
```

### E2E Tests (Integration)
```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('Feature Name @integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication if needed
    await page.context().addCookies([
      { name: 'is_registered', value: 'true', domain: 'localhost', path: '/' },
      { name: 'identity', value: 'teacher', domain: 'localhost', path: '/' },
    ]);
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token');
    });
  });

  test('should do something with real backend', async ({ page }) => {
    // test steps that interact with real backend
  });
});
```

## CI/CD Recommendations

```yaml
# GitHub Actions example
- name: Run unit tests
  run: npm test -- --run

- name: Run E2E tests (non-integration)
  run: npm run test:e2e

# Optional: Run integration tests in separate job with required services
- name: Run integration tests
  run: RUN_INTEGRATION_TESTS=true npm run test:e2e
  # Only run on main branch or manual trigger
  if: github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts` or individual tests
- Check if backend services are running
- Verify network connectivity

### Authentication failures in integration tests
- Ensure cookies are set with correct domain ('localhost')
- Verify localStorage token is set before navigation
- Check that backend API is accessible

### Task-related tests failing
- Verify at least one task exists in database with:
  - `curriculum_path`: `mathematics:grade_9_10:Halmazok:Halmazműveletek:Unió (egyesítés)`
  - `isPublished`: `true`
- Check backend is running on correct port (3000)
- Verify Firestore indexes are built

## Summary

✅ **Unit Tests**: 73/73 passing
✅ **E2E Tests (Standard)**: 36/36 passing
⚠️ **E2E Tests (Integration)**: Require manual setup, run with `RUN_INTEGRATION_TESTS=true`
