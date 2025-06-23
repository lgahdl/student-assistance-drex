# Integration Tests Documentation

This directory contains comprehensive integration tests for the Student Assistance Server API.

## Test Structure

### Test Files

- `health.test.ts` - Basic health check endpoint tests
- `auth-simple.test.ts` - Core authentication functionality tests
- `api-endpoints.test.ts` - Complete API endpoint tests with error handling
- `setup.ts` - Test configuration and utilities
- `testApp.ts` - Test application factory

### Test Configuration

- `jest.config.js` - Jest configuration for TypeScript and testing environment
- `.env.test` - Test environment variables

## Running Tests

### Individual Test Files
```bash
# Run health check tests
pnpm test tests/health.test.ts

# Run authentication tests
pnpm test tests/auth-simple.test.ts

# Run complete API tests
pnpm test tests/api-endpoints.test.ts
```

### All Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

## Test Coverage

### ✅ Authentication Endpoints
- `POST /api/auth/login` - Admin/Staff login
- `POST /api/auth/student/wallet` - Student wallet authentication
- `POST /api/auth/users` - User creation (admin only)
- `GET /api/auth/users` - List users (admin only)
- `GET /api/auth/me` - Get current user info

### ✅ User Management
- User creation with proper role validation
- Password hashing and verification
- JWT token generation and validation
- Role-based access control

### ✅ Student Operations
- Student wallet authentication
- Token validation for students
- Student profile access

### ✅ Error Handling
- Invalid credentials
- Invalid wallet addresses
- Unauthorized access
- Validation errors
- Database constraint violations

### ✅ Database Operations
- Proper test isolation
- Database cleanup between tests
- Foreign key constraint handling
- Unique constraint validation

## Test Utilities

### `createTestUser(role)`
Creates a test user with the specified role ('admin' or 'staff').

```typescript
const admin = await createTestUser('admin');
const staff = await createTestUser('staff');
```

### `createTestStudent()`
Creates a test student with a random wallet address.

```typescript
const student = await createTestStudent();
```

### `createTestReceiver()`
Creates a test receiver with a random address.

```typescript
const receiver = await createTestReceiver();
```

### `createTestExpenseType()`
Creates a test expense type.

```typescript
const expenseType = await createTestExpenseType();
```

## Test Data Management

### Database Cleanup
Tests automatically clean up data after each test to ensure isolation:

1. receiverExpenseType records
2. spendingLimit records  
3. transaction records
4. receiver records
5. student records
6. expenseType records
7. user records

### Random Data Generation
- Wallet addresses: 40-character hex strings with '0x' prefix
- CPF numbers: 11-digit Brazilian tax ID numbers
- Usernames: Timestamped with random suffixes

## Authentication Flow Testing

### Admin/Staff Login Flow
```typescript
const admin = await createTestUser('admin');
const loginResponse = await request(app)
  .post('/api/auth/login')
  .send({ username: admin.username, password: 'testpassword' });
const token = loginResponse.body.data.token;
```

### Student Wallet Authentication Flow
```typescript
const student = await createTestStudent();
const authResponse = await request(app)
  .post('/api/auth/student/wallet')
  .send({ walletAddress: student.walletAddress });
const token = authResponse.body.data.token;
```

## Best Practices

### Test Isolation
- Each test is independent and can run in any order
- Database is cleaned between tests
- No shared state between tests

### Error Testing
- Tests cover both success and failure scenarios
- Proper HTTP status codes are verified
- Error messages are validated

### Authentication Testing
- All protected endpoints require valid tokens
- Role-based access is properly tested
- Invalid tokens are rejected

### Data Validation
- Input validation is thoroughly tested
- Database constraints are verified
- Edge cases are covered

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- Fast execution (< 30 seconds for full suite)
- Reliable database cleanup
- Proper error handling
- No external dependencies

## Troubleshooting

### Database Connection Issues
Ensure PostgreSQL is running and the test database URL is correct in `.env.test`.

### Port Conflicts
The test app doesn't bind to a port, so there should be no conflicts.

### Memory Leaks
Tests use `forceExit` to prevent hanging processes.

### Prisma Issues
Tests use a separate Prisma client instance for test isolation.

## Future Enhancements

### Planned Test Additions
- Transaction management tests
- Receiver management tests  
- Expense type management tests
- File upload tests
- Rate limiting tests
- Performance tests

### Test Performance
- Current suite runs in ~3 seconds
- Target: Keep under 10 seconds for full suite
- Parallel test execution for larger suites 