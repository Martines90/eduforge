# EduForge E2E Tests

End-to-end tests for EduForge using Playwright.

## Structure

```
e2e/
├── fixtures/
│   ├── api-mocks.ts          # API mocking utilities
│   └── test-fixtures.ts      # Custom test fixtures
├── pages/
│   └── registration.page.ts  # Page Object Model for registration
├── teacher-registration.spec.ts  # Teacher registration E2E tests
└── README.md
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Coverage

### Teacher Registration Flow (Happy Path Only)
- ✅ Complete registration with "Create Task" action
- ✅ Complete registration with "Search Tasks" action
- ✅ Mobile viewport support - Complete flow (iPhone, Pixel)
- ✅ Mobile viewport support - Verification code handling

**Focus**: All tests verify successful user flows only, checking critical state changes and messages at each step.

## API Mocking

All API calls are mocked using Playwright's `route` API:
- `/api/auth/register` - Returns success with mock verification code
- `/api/auth/verify-email` - Returns success with mock JWT token
- Firebase authentication is mocked to avoid real auth calls

## Page Object Model

The `RegistrationPage` class provides:
- Locators for all registration flow elements
- Helper methods for common actions
- Complete flow methods (e.g., `completeTeacherRegistration`)

## Mobile Testing

Tests run on multiple viewports:
- Desktop Chrome (1280x720)
- Mobile Chrome (Pixel 5 - 393x851)
- Mobile Safari (iPhone 12 - 390x844)

## Best Practices

1. **Use Page Objects**: All selectors are in page objects, not in test files
2. **Use Test IDs**: MUI components use `data-testid` attributes for stable selectors
3. **Mock APIs**: Never make real API calls in E2E tests
4. **Wait for State**: Use `waitForLoadState`, `waitForURL`, etc.
5. **Test User Actions**: Focus on what users actually do
6. **Verify Critical State**: Check success messages, navigation, etc.
7. **Happy Path Only**: E2E tests focus on successful flows
8. **No Screenshots/Videos**: Tests output text logs only to save space

## Adding New Tests

1. Create a new spec file: `e2e/your-feature.spec.ts`
2. Import test fixtures: `import { test, expect } from './fixtures/test-fixtures'`
3. Use Page Object Models or create new ones in `e2e/pages/`
4. Mock APIs in `beforeEach` hook
5. Follow existing test structure with `test.step()` for clarity

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is starting correctly
- Verify API mocks are set up properly

### Selectors not working
- Use Playwright Inspector: `npm run test:e2e:debug`
- Update locators in page objects
- Check if elements have proper accessibility roles

### Flaky tests
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `test.step()` to isolate failures
- Check for race conditions with API mocks
