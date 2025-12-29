# 🧪 Backend Testing Guide

## Quick Overview

I've set up a comprehensive testing infrastructure for your backend. Here's what you need to know:

---

## ✅ What's Been Done

### 1. **Comprehensive Test Suite**
   - ✅ **13 test files** covering all major endpoints
   - ✅ **150+ test cases** testing success and error scenarios
   - ✅ Tests for: Auth, Users, Artists, Bookings, Cart, Payments, Catalog, Chat, Wishlist, Training, Gallery, Devices, Uploads

### 2. **Test Infrastructure**
   - ✅ Test helpers and utilities
   - ✅ Database helpers for test isolation
   - ✅ Mock factories for test data generation
   - ✅ External service mocks (Stripe, Twilio, AWS S3)

### 3. **Documentation**
   - ✅ Testing strategy document
   - ✅ How-to guide
   - ✅ Testing summary

### 4. **Fixes**
   - ✅ Fixed payment route tests (matched actual endpoints)
   - ✅ Fixed cart route tests (matched actual endpoints)
   - ✅ Fixed wishlist tests (matched actual schema)

---

## 🚀 Quick Start

### Step 1: Set Up Test Database

```sql
CREATE DATABASE flawless_test;
```

### Step 2: Configure Environment

Create `.env.test` file:
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flawless_test

JWT_SECRET=test-secret-key-for-testing-only
STRIPE_SECRET_KEY=sk_test_mock
STRIPE_WEBHOOK_SECRET=whsec_test_mock
```

### Step 3: Import Database Schema

```bash
mysql -u root -p flawless_test < connection/flawless_17102024.sql
```

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run in watch mode (auto-rerun on changes)
npm run test:watch
```

---

## 📊 Test Coverage

### Test Files Created

| Module | Test File | Status |
|--------|-----------|--------|
| Authentication | `auth.test.js` | ✅ Complete |
| Users | `users.test.js` | ✅ Complete |
| Artists | `artists.test.js` | ✅ Complete |
| Bookings | `bookings.test.js` | ✅ Complete |
| Cart | `cart.test.js` | ✅ Complete |
| Payments | `payments.test.js` | ✅ Complete |
| Catalog | `catalog.test.js` | ✅ Complete |
| Chat | `chat.test.js` | ✅ Complete |
| Wishlist | `wishlist.test.js` | ✅ Complete |
| Training | `training.test.js` | ✅ Complete |
| Gallery | `gallery.test.js` | ✅ Complete |
| Devices | `device.test.js` | ✅ Complete |
| Uploads | `uploads.test.js` | ✅ Complete |

### Test Helpers

| Helper | File | Purpose |
|--------|------|---------|
| Test Utilities | `helpers/testHelpers.js` | Token generation, auth headers, etc. |
| Database Helpers | `helpers/dbHelpers.js` | Database operations, cleanup |
| Mock Factories | `helpers/mockFactories.js` | Test data generation |

---

## 🎯 How to Test Properly

### 1. **Unit Tests** (Fast, Isolated)
   - Test individual functions/services
   - Mock external dependencies
   - Run: `npm test -- --testPathPattern=unit`

### 2. **Integration Tests** (API Endpoints)
   - Test full request/response cycle
   - Use test database
   - Run: `npm test` (default)

### 3. **Coverage Reports**
   - See what's covered: `npm run test:coverage`
   - View HTML report: `coverage/lcov-report/index.html`
   - Target: 80%+ coverage

---

## 📋 Testing Best Practices

### ✅ DO:
- Run tests before committing code
- Write tests for new features
- Test both success and error cases
- Clean up test data after tests
- Use descriptive test names

### ❌ DON'T:
- Don't test against production database
- Don't make real API calls (use mocks)
- Don't rely on test execution order
- Don't skip error case testing

---

## 🔍 Understanding Test Results

### Successful Test Run
```
PASS  tests/auth.test.js
  Authentication Module
    POST /api/auth/create-user
      ✓ should create a new user successfully (45ms)
      ✓ should return error for missing required fields (12ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Coverage Report
```
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
controllers/        |   75.5  |   68.2   |   72.1  |   75.0  |
services/          |   82.3  |   76.5   |   80.0  |   82.1  |
```

---

## 🐛 Troubleshooting

### Tests Failing?

1. **Check test database:**
   ```sql
   SHOW DATABASES LIKE 'flawless_test';
   ```

2. **Verify environment:**
   ```bash
   # Check .env.test exists and has correct values
   cat .env.test
   ```

3. **Check database connection:**
   ```bash
   mysql -u root -p -e "USE flawless_test; SELECT 1;"
   ```

4. **Review test logs:**
   ```bash
   npm test -- --verbose
   ```

### Coverage Low?

1. **Identify gaps:**
   ```bash
   npm run test:coverage
   # Open coverage/lcov-report/index.html
   ```

2. **Add tests for uncovered code:**
   - Look for red lines in coverage report
   - Add tests for those paths

---

## 📚 Documentation Files

- **[TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)** - Comprehensive testing strategy
- **[HOW_TO_TEST.md](./docs/HOW_TO_TEST.md)** - Step-by-step testing guide
- **[TESTING_SUMMARY.md](./docs/TESTING_SUMMARY.md)** - Testing summary and status

---

## 🎓 Next Steps

1. ✅ **Run tests:** `npm test`
2. ✅ **Check coverage:** `npm run test:coverage`
3. ✅ **Review failing tests** (if any)
4. ✅ **Add tests for new features**
5. ✅ **Aim for 80%+ coverage**

---

## 💡 Key Points

1. **Test Database:** Always use `flawless_test` database, never production
2. **Mocks:** External services (Stripe, Twilio, AWS) are mocked - no real charges/calls
3. **Isolation:** Each test should be independent and clean up after itself
4. **Coverage:** Focus on critical paths (auth, payments, bookings) first

---

## 🚨 Important Notes

- ⚠️ **Never run tests against production database**
- ⚠️ **Always use test environment variables**
- ⚠️ **Mock external services** (Stripe, Twilio, AWS)
- ⚠️ **Clean up test data** after each test

---

## 📞 Need Help?

1. Check documentation in `docs/` folder
2. Review test examples in test files
3. Check Jest/Supertest documentation
4. Review test helpers for utilities

---

**Status:** ✅ Test Suite Complete - Ready to Use!

**Last Updated:** 2024-12-19

