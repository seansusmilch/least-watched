# Writing Tests for least-watched

When writing tests for this project, follow these guidelines to ensure comprehensive, maintainable, and reliable test coverage.

## Test Types and Structure

### 1. Unit Tests
**Location:** `src/**/*.test.ts` or `src/**/*.spec.ts`

**What to Test:**
- Pure functions and business logic (e.g., `deletion-score-calculator.ts`, utility functions)
- Data transformations and formatters
- Validation schemas (Zod schemas)
- Type guards and type utilities
- Mathematical calculations and scoring algorithms

**Requirements:**
- Test all edge cases (null, undefined, empty arrays, boundary values)
- Test error conditions and invalid inputs
- Use descriptive test names that explain what is being tested
- Group related tests using `describe` blocks
- Mock external dependencies (database, APIs) when testing business logic

**Example Focus Areas:**
- `deletion-score-calculator.ts`: Test scoring calculations with various inputs, disabled categories, edge cases
- `src/lib/utils/*`: Test formatters, converters, and helper functions
- `src/lib/validation/*`: Test schema validation, error messages, edge cases

### 2. Integration Tests
**Location:** `src/**/*.integration.test.ts` or `tests/integration/**/*.test.ts`

**What to Test:**
- Server actions (`src/lib/actions/**/*.ts`)
- Database operations with Prisma
- Service layer interactions (combining multiple services)
- API client wrappers (Sonarr, Radarr, Emby)

**Requirements:**
- Use a test database (separate from development database)
- Set up and tear down test data before/after each test
- Test the full flow: input → processing → database → output
- Test error handling and rollback scenarios
- Mock external API calls (Sonarr, Radarr, Emby) but test real database operations

**Database Testing:**
- Use Prisma's test database capabilities
- Reset database state between tests (use transactions or database reset)
- Test CRUD operations end-to-end
- Test relationships and foreign key constraints
- Test database validation and constraints

**Server Actions Testing:**
- Test form state creation and error handling
- Test `revalidatePath` calls (verify they're called correctly)
- Test validation error handling
- Test success and failure paths
- Mock external API calls but test real database operations

### 3. Component Tests
**Location:** `src/components/**/*.test.tsx`

**What to Test:**
- React component rendering
- User interactions (clicks, form submissions, input changes)
- Component state management
- Props handling and edge cases
- Integration with hooks (React Query, Zustand)

**Requirements:**
- Use React Testing Library for component tests
- Test user-facing behavior, not implementation details
- Test accessibility (ARIA labels, keyboard navigation)
- Mock server actions and API calls
- Test loading states, error states, and empty states
- Test form validation and error display

**Testing Patterns:**
- Use `render` from React Testing Library
- Query elements by role, label, or test ID (prefer role and label)
- Use `waitFor` for async operations
- Mock Next.js router and server actions
- Test component isolation (don't test parent/child interactions unless necessary)

### 4. E2E Tests
**Location:** `e2e/**/*.spec.ts` (already using Playwright)

**What to Test:**
- Complete user workflows
- Page navigation and routing
- Critical user paths (settings configuration, media processing, deletion)
- Cross-browser compatibility (if needed)

**Requirements:**
- Use Playwright's best practices (page object model if needed)
- Use test fixtures for common setup (`e2e/fixtures/test-fixtures.ts`)
- Test real user interactions, not implementation details
- Use `data-testid` attributes sparingly (prefer semantic selectors)
- Test error scenarios and edge cases from user perspective

## Testing Best Practices

### General Principles
1. **Arrange-Act-Assert (AAA) Pattern**: Structure tests clearly with setup, action, and assertion sections
2. **Test Isolation**: Each test should be independent and not rely on other tests
3. **Descriptive Names**: Test names should clearly describe what is being tested and expected outcome
4. **One Assertion Per Test**: Prefer multiple focused tests over one test with many assertions (but allow related assertions)
5. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it

### Mocking Guidelines
- **Mock External APIs**: Always mock Sonarr, Radarr, and Emby API calls
- **Mock Database in Unit Tests**: Use mocks for database operations in unit tests
- **Use Real Database in Integration Tests**: Use a real test database for integration tests
- **Mock Next.js Features**: Mock `next/cache` (`revalidatePath`), `next/navigation` (router), server actions when testing components

### Async Testing
- Always properly await async operations
- Use `waitFor` for UI updates that happen asynchronously
- Handle promises correctly (don't forget to await or return)
- Test timeout scenarios and error handling

### Error Handling
- Test both success and failure paths
- Test error messages and error states
- Test validation errors and edge cases
- Test network failures and API errors
- Test database constraint violations

### Test Data
- Use factories or builders for creating test data
- Keep test data minimal and focused (only include what's needed)
- Use realistic data that matches production patterns
- Create helper functions for common test data patterns

## Project-Specific Considerations

### Next.js App Router
- Mock server actions when testing components
- Test server components separately from client components
- Use `next/navigation` mocks for routing tests
- Test `revalidatePath` calls in server action tests

### Prisma & Database
- Use a separate test database (SQLite in-memory or separate file)
- Reset database state between tests (use transactions or `db:reset`)
- Test migrations and schema changes separately
- Use Prisma's transaction capabilities for test isolation

### External APIs (Sonarr, Radarr, Emby)
- Always mock API calls in tests
- Test API error handling (network errors, 404s, 500s, timeouts)
- Test API response parsing and transformation
- Test retry logic if implemented

### State Management
- Test Zustand stores in isolation
- Test React Query hooks with proper providers
- Mock server state when testing client state
- Test state synchronization between stores

### TypeScript
- Leverage TypeScript types in tests (use proper types for test data)
- Test type guards and type narrowing
- Ensure test data matches expected types

## Test Organization

### File Naming
- Unit tests: `*.test.ts` or `*.spec.ts` next to source files or in `__tests__` directories
- Integration tests: `*.integration.test.ts` or in `tests/integration/`
- Component tests: `*.test.tsx` next to component files
- E2E tests: `*.spec.ts` in `e2e/` directory

### Test Structure
```typescript
describe('Feature or Module Name', () => {
  describe('Specific Function or Component', () => {
    beforeEach(() => {
      // Setup
    });

    afterEach(() => {
      // Cleanup
    });

    test('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Coverage Goals

Aim for:
- **High coverage** on business logic and critical paths (deletion scoring, media processing)
- **Medium coverage** on utilities and helpers
- **E2E coverage** for critical user workflows
- **Component coverage** for complex or frequently used components

Focus on testing:
1. Critical business logic (scoring calculations, media processing)
2. Error-prone areas (API integrations, database operations)
3. User-facing features (forms, settings, media table)
4. Edge cases and boundary conditions

## Running Tests

- Unit/Integration/Component tests: `bun test` (when test runner is configured)
- E2E tests: `bun run test:e2e`
- E2E tests with UI: `bun run test:e2e:ui`
- Watch mode: Configure test runner watch mode

## Common Pitfalls to Avoid

1. **Testing implementation details**: Test what the code does, not how
2. **Over-mocking**: Don't mock everything; use real implementations when appropriate
3. **Flaky tests**: Ensure tests are deterministic and don't rely on timing or external state
4. **Slow tests**: Keep unit tests fast; use mocks appropriately
5. **Missing edge cases**: Test null, undefined, empty arrays, boundary values
6. **Not testing errors**: Always test error paths and error handling
7. **Test duplication**: Extract common test setup into helpers or fixtures
8. **Hardcoded values**: Use constants or factories for test data

## Example Test Patterns

### Unit Test Example (Business Logic)
```typescript
import { describe, test, expect } from 'bun:test';
import { deletionScoreCalculator } from '@/lib/deletion-score-calculator';

describe('deletionScoreCalculator', () => {
  test('should calculate score correctly with all factors enabled', () => {
    const mediaItem = { /* test data */ };
    const settings = { /* test settings */ };
    const result = deletionScoreCalculator(mediaItem, settings);
    expect(result.totalScore).toBeGreaterThan(0);
  });

  test('should return 0 when all factors are disabled', () => {
    // Test disabled state
  });

  test('should handle null values gracefully', () => {
    // Test edge cases
  });
});
```

### Integration Test Example (Server Action)
```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createSonarrSetting } from '@/lib/actions/settings/sonarr';
import { prisma } from '@/lib/database';

describe('createSonarrSetting', () => {
  beforeEach(async () => {
    // Setup test database
  });

  afterEach(async () => {
    // Cleanup test database
  });

  test('should create setting successfully', async () => {
    const input = { /* valid input */ };
    const result = await createSonarrSetting(input);
    expect(result.success).toBe(true);
  });

  test('should return validation errors for invalid input', async () => {
    // Test validation
  });
});
```

### Component Test Example
```typescript
import { describe, test, expect } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsForm } from '@/components/settings/settings-form';

describe('SettingsForm', () => {
  test('should render form fields', () => {
    render(<SettingsForm />);
    expect(screen.getByLabelText('Server URL')).toBeInTheDocument();
  });

  test('should display validation errors', async () => {
    // Test form validation
  });
});
```

## Additional Resources

- Review existing E2E tests in `e2e/` for patterns
- Check project documentation in `docs/` for business logic understanding
- Review `.cursor/rules/` for project-specific patterns and conventions