# Media Processor Tests

## Test Safety

**All tests are designed to NOT make network requests to external services.**

### Unit Tests ✅
- **Location**: `*.test.ts` files
- **Network Requests**: None
- **Status**: Safe to run anytime
- These test pure functions and don't interact with external services

### Integration Tests

#### `storage.integration.test.ts` ✅
- **Network Requests**: None
- **Database**: Uses local SQLite (test database)
- **Status**: Safe to run anytime
- Only tests database operations with Prisma

#### `media-processing.integration.test.ts` ✅
- **Network Requests**: None
- **Database**: Uses local SQLite (test database)
- **Status**: Safe to run anytime
- Only tests server actions with database operations

#### `media-processor.integration.test.ts` ⚠️
- **Network Requests**: Potentially risky if mocks fail
- **Status**: Requires proper mocking setup
- **Recommendation**: These tests attempt to mock external services, but the mocking approach may not be 100% reliable

## Running Tests Safely

### Recommended: Run only unit tests
```bash
bun test:unit
```

### Run all tests (with caution)
```bash
# Set test mode to prevent accidental network calls
NODE_ENV=test bun test
```

### Run integration tests separately
```bash
# Storage tests (safe)
bun test src/lib/media-processor/storage.integration.test.ts

# Media processor tests (requires mocking)
NODE_ENV=test bun test src/lib/media-processor/media-processor.integration.test.ts
```

## Preventing Network Requests

The tests use the following strategies to prevent network requests:

1. **Mocking**: External service methods are mocked using Bun's `mock()` and `spyOn()`
2. **Test Mode Check**: Tests check for `NODE_ENV=test` or `CI=true` before running
3. **Local Database**: Integration tests use SQLite (local file database)

## If Tests Make Network Requests

If you notice tests making actual network requests:

1. **Stop the tests immediately** (Ctrl+C)
2. **Check your environment**: Ensure `NODE_ENV=test` is set
3. **Review mocks**: Verify that all external service calls are properly mocked
4. **Use test database**: Ensure tests use a separate test database, not production

## Test Database

Integration tests use Prisma with SQLite. The database file is typically:
- Development: `prisma/dev.db`
- Tests: Should use a separate test database (configure via `DATABASE_URL`)

To use a separate test database:
```bash
DATABASE_URL="file:./test.db" bun test
```
