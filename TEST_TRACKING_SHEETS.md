# 📊 Test Tracking Sheets - Excel/Google Sheets Templates

## Overview
This document provides templates for tracking all aspects of testing. Use these in Excel or Google Sheets.

---

## Sheet 1: Test Case Registry

### Purpose
Master list of all test cases with status tracking.

### Columns

| Test ID | Module | Feature | Endpoint | Method | Priority | Type | Status | Assigned To | Created | Updated | Notes |
|---------|--------|---------|-----------|--------|----------|------|--------|-------------|---------|---------|-------|
| TC-001 | Auth | User Registration | /api/auth/create-user | POST | High | Functional | ✅ Pass | John | 2025-01-01 | 2025-01-01 | - |
| TC-002 | Auth | User Login | /api/auth/token | POST | High | Functional | ⏳ Pending | John | 2025-01-01 | - | - |
| TC-003 | Auth | OTP Generation | /api/auth/get-otp | GET | High | Functional | ❌ Fail | John | 2025-01-01 | 2025-01-01 | Bug found |

**Status Options:**
- ✅ Pass
- ❌ Fail
- ⏳ Pending
- ⚠️ Partial
- ⏸️ Blocked
- 🔄 Retest

**Priority Options:**
- Critical
- High
- Medium
- Low

**Type Options:**
- Functional
- Integration
- Security
- Performance
- Edge Case
- Regression

---

## Sheet 2: Test Execution Log

### Purpose
Detailed log of each test execution with timestamps and results.

### Columns

| Date | Time | Test ID | Environment | Tester | Result | Duration (ms) | Response Code | Notes | Screenshot | Log File |
|------|------|---------|-------------|--------|--------|---------------|---------------|-------|------------|----------|
| 2025-01-01 | 10:30 | TC-001 | Dev | John | ✅ Pass | 250 | 200 | - | [Link] | [Link] |
| 2025-01-01 | 10:35 | TC-002 | Dev | John | ❌ Fail | 300 | 401 | Token expired | [Link] | [Link] |
| 2025-01-01 | 11:00 | TC-002 | Dev | John | ✅ Pass | 280 | 200 | Fixed | [Link] | [Link] |

**Result Options:**
- ✅ Pass
- ❌ Fail
- ⚠️ Partial
- ⏸️ Blocked

---

## Sheet 3: Bug Tracking

### Purpose
Track all bugs found during testing.

### Columns

| Bug ID | Test ID | Severity | Module | Endpoint | Description | Steps to Reproduce | Expected | Actual | Status | Assigned To | Created | Fixed | Verified |
|--------|---------|----------|--------|----------|-------------|-------------------|----------|--------|--------|-------------|---------|-------|----------|
| BUG-001 | TC-002 | High | Auth | /api/auth/token | Token not generated | 1. Create user 2. Login | Token returned | No token | 🔴 Open | Dev Team | 2025-01-01 | - | - |
| BUG-002 | TC-005 | Medium | User | /api/users/profile | Profile not loading | 1. Login 2. Get profile | Profile data | 404 error | 🟡 In Progress | Dev Team | 2025-01-01 | - | - |
| BUG-003 | TC-010 | Low | Catalog | /api/catalog/services | Slow response | 1. Get services | < 500ms | 2.5s | 🟢 Fixed | Dev Team | 2025-01-01 | 2025-01-02 | ✅ |

**Severity Options:**
- Critical (Blocks core functionality)
- High (Major feature broken)
- Medium (Minor feature issue)
- Low (Cosmetic/Enhancement)

**Status Options:**
- 🔴 Open
- 🟡 In Progress
- 🟢 Fixed
- ✅ Verified
- ❌ Won't Fix
- 📋 Duplicate

---

## Sheet 4: User Journey Matrix

### Purpose
Track complete user journeys end-to-end.

### Columns

| Journey ID | User Type | Journey Name | Steps | Expected Outcome | Test Status | Last Tested | Notes |
|------------|-----------|--------------|-------|------------------|-------------|-------------|-------|
| UJ-001 | New User | Complete Registration | 1. Register 2. Verify OTP 3. Login 4. Complete Profile | User registered and logged in | ⏳ Testing | 2025-01-01 | - |
| UJ-002 | User | Book Service | 1. Browse 2. Add to cart 3. Checkout 4. Pay | Booking created | ✅ Pass | 2025-01-01 | - |
| UJ-003 | Artist | Accept Booking | 1. Login 2. View bookings 3. Accept | Booking accepted | ⏳ Testing | 2025-01-01 | - |

**Test Status Options:**
- ✅ Pass
- ❌ Fail
- ⏳ Testing
- ⏸️ Blocked

---

## Sheet 5: API Performance Metrics

### Purpose
Track performance metrics for each endpoint.

### Columns

| Endpoint | Method | Date | Avg Response (ms) | Min (ms) | Max (ms) | 95th Percentile (ms) | Status Code | Error Rate (%) | Requests | Notes |
|----------|--------|------|-------------------|---------|---------|---------------------|-------------|----------------|----------|-------|
| /api/auth/create-user | POST | 2025-01-01 | 250 | 180 | 450 | 380 | 200 | 0% | 100 | - |
| /api/auth/token | POST | 2025-01-01 | 120 | 90 | 200 | 180 | 200 | 2% | 100 | Token expiry issue |
| /api/artists/profile | GET | 2025-01-01 | 150 | 100 | 300 | 250 | 200 | 0% | 50 | - |

**Performance Targets:**
- ✅ Excellent: < 200ms
- ⚠️ Good: 200-500ms
- ❌ Needs Improvement: > 500ms

---

## Sheet 6: Edge Case Testing

### Purpose
Track edge cases and boundary conditions.

### Columns

| Test ID | Edge Case Type | Module | Endpoint | Input | Expected Behavior | Actual Behavior | Status | Notes |
|---------|---------------|--------|----------|-------|------------------|-----------------|--------|-------|
| EC-001 | Long String | Auth | /api/auth/create-user | 10,000 char name | Truncated/Rejected | - | ⏳ Pending | - |
| EC-002 | SQL Injection | Auth | /api/auth/create-user | `'; DROP TABLE users; --` | Rejected | - | ⏳ Pending | - |
| EC-003 | Special Chars | User | /api/users/profile | `!@#$%^&*()` | Handled properly | - | ⏳ Pending | - |
| EC-004 | Empty String | Cart | /api/cart/add | `""` | Rejected | - | ⏳ Pending | - |
| EC-005 | Null Value | Booking | /api/bookings/create | `null` | Rejected | - | ⏳ Pending | - |
| EC-006 | Unicode | User | /api/users/profile | `测试用户` | Handled | - | ⏳ Pending | - |
| EC-007 | Boundary Min | Booking | /api/bookings/create | Min valid values | Accepted | - | ⏳ Pending | - |
| EC-008 | Boundary Max | Booking | /api/bookings/create | Max valid values | Accepted | - | ⏳ Pending | - |

**Edge Case Types:**
- Long String
- SQL Injection
- XSS
- Special Characters
- Empty/Null
- Unicode
- Boundary Values
- Concurrent Requests
- Timeout
- Large Payload

---

## Sheet 7: Test Coverage Matrix

### Purpose
Track test coverage by module and test type.

### Columns

| Module | Total Endpoints | Unit Tests | Integration Tests | API Tests | E2E Tests | Security Tests | Performance Tests | Coverage % | Status |
|--------|----------------|------------|-------------------|-----------|-----------|----------------|-------------------|------------|--------|
| Authentication | 8 | 8 | 8 | 8 | 2 | 5 | 2 | 95% | ✅ Complete |
| User Management | 12 | 10 | 8 | 12 | 3 | 3 | 2 | 80% | ⏳ In Progress |
| Artist Management | 15 | 12 | 10 | 15 | 3 | 3 | 2 | 75% | ⏳ In Progress |
| Bookings | 10 | 8 | 6 | 10 | 4 | 2 | 2 | 70% | ⏳ In Progress |
| Cart | 6 | 5 | 4 | 6 | 2 | 1 | 1 | 65% | ⏳ In Progress |
| Catalog | 8 | 6 | 5 | 8 | 2 | 1 | 2 | 60% | ⏳ In Progress |

**Coverage Calculation:**
```
Coverage % = (Tests Executed / Total Possible Tests) × 100
```

**Status Options:**
- ✅ Complete (90%+)
- ⏳ In Progress (50-89%)
- ❌ Not Started (< 50%)

---

## Sheet 8: Daily Test Summary

### Purpose
Daily summary of testing activities.

### Columns

| Date | Tester | Tests Executed | Tests Passed | Tests Failed | Bugs Found | Bugs Fixed | Coverage % | Notes |
|------|--------|----------------|--------------|--------------|------------|------------|-------------|-------|
| 2025-01-01 | John | 25 | 23 | 2 | 3 | 1 | 45% | Good progress |
| 2025-01-02 | John | 30 | 28 | 2 | 2 | 2 | 55% | Fixed critical bugs |
| 2025-01-03 | Jane | 35 | 33 | 2 | 1 | 3 | 65% | - |

---

## Sheet 9: Test Environment Checklist

### Purpose
Track test environment setup and configuration.

### Columns

| Environment | Server URL | Database | Status | Last Verified | Notes |
|-------------|------------|----------|--------|---------------|-------|
| Development | http://localhost:3000 | Dev DB | ✅ Active | 2025-01-01 | - |
| Staging | https://staging.api.com | Staging DB | ✅ Active | 2025-01-01 | - |
| Production | https://api.com | Prod DB | ⏸️ Read Only | 2025-01-01 | Testing disabled |

**Status Options:**
- ✅ Active
- ⏸️ Inactive
- 🔧 Maintenance
- ❌ Down

---

## Sheet 10: Test Data Sets

### Purpose
Track test data used for different scenarios.

### Columns

| Data Set ID | Name | Purpose | User Type | Data | Status | Last Used |
|-------------|------|---------|-----------|------|--------|-----------|
| TD-001 | Valid User | Happy path testing | User | {phone: "9876543210", email: "user@test.com"} | ✅ Active | 2025-01-01 |
| TD-002 | Valid Artist | Happy path testing | Artist | {phone: "9876543211", email: "artist@test.com"} | ✅ Active | 2025-01-01 |
| TD-003 | Invalid User | Error testing | User | {phone: "invalid", email: "bad-email"} | ✅ Active | 2025-01-01 |
| TD-004 | Edge Case Data | Edge case testing | Both | {name: "A" * 10000} | ✅ Active | 2025-01-01 |

---

## 📊 Dashboard Formulas (Google Sheets)

### Test Pass Rate
```
=COUNTIF(Sheet1!G:G, "✅ Pass") / COUNT(Sheet1!G:G) * 100
```

### Bug Count by Severity
```
=COUNTIF(Sheet3!C:C, "Critical")
=COUNTIF(Sheet3!C:C, "High")
=COUNTIF(Sheet3!C:C, "Medium")
=COUNTIF(Sheet3!C:C, "Low")
```

### Average Response Time
```
=AVERAGE(Sheet5!D:D)
```

### Coverage Percentage
```
=SUM(Sheet7!I:I) / COUNT(Sheet7!I:I)
```

---

## 🎨 Dashboard Visualization

### Recommended Charts

1. **Test Status Pie Chart**
   - Pass/Fail/Pending breakdown

2. **Bug Severity Bar Chart**
   - Critical/High/Medium/Low distribution

3. **Coverage Trend Line Chart**
   - Coverage % over time

4. **Performance Trend Chart**
   - Response times over time

5. **Module Status Heatmap**
   - Color-coded coverage by module

---

## 📥 Import/Export

### Export from Postman
1. Run Postman collection
2. Export results as CSV
3. Import into tracking sheets

### Export from Jest
1. Run Jest with `--json` flag
2. Parse JSON results
3. Import into tracking sheets

---

## 🔄 Automation

### Automated Updates
- Use Postman API to update sheets
- Use Google Sheets API
- Use webhooks for real-time updates

---

**Use these templates to track comprehensive testing! 📊**

