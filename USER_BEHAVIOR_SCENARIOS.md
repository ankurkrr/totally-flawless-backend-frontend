# 👥 User Behavior Scenarios - Complete Guide

## Overview
This document outlines all user behavior scenarios to test, including happy paths, error cases, edge cases, and unexpected behaviors.

---

## 🎯 Scenario Categories

### 1. Happy Path Scenarios ✅
### 2. Error Scenarios ❌
### 3. Edge Cases ⚠️
### 4. Security Scenarios 🔒
### 5. Performance Scenarios ⚡
### 6. Business Logic Scenarios 💼
### 7. Unexpected Behaviors 🤔

---

## 1. Happy Path Scenarios ✅

### User Registration & Login Flow

**Scenario UH-001: New User Registration**
```
1. User opens app
2. Clicks "Sign Up"
3. Enters valid phone number
4. Receives OTP via SMS
5. Enters correct OTP
6. Enters email, name, password
7. Account created successfully
8. User logged in automatically
9. Token received
10. User redirected to home
```
**Expected:** All steps complete successfully  
**Test:** TC-AUTH-001

---

**Scenario UH-002: Existing User Login**
```
1. User opens app
2. Clicks "Login"
3. Enters registered phone number
4. Receives OTP
5. Enters correct OTP
6. User logged in
7. Token received
8. User redirected to dashboard
```
**Expected:** Login successful, token valid  
**Test:** TC-AUTH-007

---

**Scenario UH-003: Artist Registration**
```
1. Artist opens app
2. Clicks "Become an Artist"
3. Enters phone number
4. Receives OTP
5. Enters business details
6. Account created
7. Token received
8. Artist can access artist dashboard
```
**Expected:** Artist account created, token received  
**Test:** TC-AUTH-011

---

### Service Booking Flow

**Scenario UH-004: Complete Booking (Now)**
```
1. User browses services
2. Selects a service
3. Clicks "Book Now"
4. Service added to cart
5. Selects address
6. Confirms booking
7. Payment processed
8. Booking confirmed
9. Artist notified
10. User receives confirmation
```
**Expected:** Booking created, payment successful, notifications sent  
**Test:** TC-BOOKING-001

---

**Scenario UH-005: Complete Booking (Later)**
```
1. User browses services
2. Selects a service
3. Clicks "Schedule"
4. Selects date and time
5. Service added to cart
6. Confirms booking
7. Payment processed
8. Booking scheduled
9. Reminder set
10. User receives confirmation
```
**Expected:** Booking scheduled, reminders set  
**Test:** TC-BOOKING-002

---

**Scenario UH-006: Artist Accepts Booking**
```
1. Artist receives booking notification
2. Opens booking details
3. Reviews service and location
4. Clicks "Accept"
5. Booking status updated
6. User notified
7. Booking appears in artist's schedule
```
**Expected:** Booking accepted, status updated, notifications sent  
**Test:** TC-ARTIST-011

---

## 2. Error Scenarios ❌

### Authentication Errors

**Scenario UE-001: Invalid Phone Number**
```
1. User enters invalid phone (too short)
2. Clicks "Get OTP"
3. Error message displayed
4. OTP not sent
```
**Expected:** Validation error, OTP not sent  
**Test:** TC-AUTH-006

---

**Scenario UE-002: Wrong OTP**
```
1. User enters phone number
2. Receives OTP
3. Enters wrong OTP
4. Clicks "Verify"
5. Error message displayed
6. Login fails
```
**Expected:** Error message, login blocked  
**Test:** TC-AUTH-008

---

**Scenario UE-003: Expired OTP**
```
1. User enters phone number
2. Receives OTP
3. Waits 10 minutes
4. Enters OTP
5. Error: OTP expired
```
**Expected:** Expired OTP error  
**Test:** TC-AUTH-009

---

**Scenario UE-004: Duplicate Registration**
```
1. User tries to register with existing phone
2. Error: Phone already registered
3. Suggests login instead
```
**Expected:** Duplicate error, helpful message  
**Test:** TC-AUTH-002

---

### Booking Errors

**Scenario UE-005: Booking Without Cart Items**
```
1. User tries to checkout with empty cart
2. Error: Cart is empty
3. Redirected to services
```
**Expected:** Error message, redirect  
**Test:** TC-BOOKING-004

---

**Scenario UE-006: Booking Unavailable Artist**
```
1. User selects service
2. Artist is unavailable
3. Error: Artist not available
4. Suggests alternative artists
```
**Expected:** Error message, alternatives shown  
**Test:** TC-BOOKING-005

---

**Scenario UE-007: Invalid Payment**
```
1. User completes booking
2. Enters invalid payment details
3. Payment fails
4. Booking not created
5. Error message displayed
```
**Expected:** Payment error, booking not created  
**Test:** TC-BOOKING-PAY-001

---

## 3. Edge Cases ⚠️

### Input Edge Cases

**Scenario UEC-001: Very Long Name**
```
1. User enters name with 10,000 characters
2. System handles gracefully
3. Either truncates or rejects with message
```
**Expected:** Handled gracefully  
**Test:** EC-001

---

**Scenario UEC-002: Special Characters in Name**
```
1. User enters: "John!@#$%^&*()_+{}|:<>?[]\';/.,-=`~"
2. System accepts or rejects appropriately
3. No errors or crashes
```
**Expected:** Handled properly  
**Test:** EC-003

---

**Scenario UEC-003: Unicode Characters**
```
1. User enters: "测试用户" or "مستخدم"
2. System stores and displays correctly
3. No encoding issues
```
**Expected:** Unicode handled correctly  
**Test:** EC-006

---

**Scenario UEC-004: Empty Fields**
```
1. User submits form with empty required fields
2. Validation errors displayed
3. Form not submitted
```
**Expected:** Validation errors  
**Test:** EC-004

---

**Scenario UEC-005: Boundary Values**
```
1. User enters minimum valid value
2. User enters maximum valid value
3. Both accepted
4. Values outside range rejected
```
**Expected:** Boundaries respected  
**Test:** EC-007, EC-008

---

### Concurrent Operations

**Scenario UEC-006: Simultaneous Bookings**
```
1. Two users book same artist at same time
2. Only one booking succeeds
3. Other user gets "Already booked" message
```
**Expected:** Race condition handled  
**Test:** EC-009

---

**Scenario UEC-007: Multiple Devices Login**
```
1. User logs in on phone
2. User logs in on tablet
3. Both sessions active
4. Token works on both
```
**Expected:** Multiple sessions supported  
**Test:** EC-010

---

## 4. Security Scenarios 🔒

### Injection Attacks

**Scenario USEC-001: SQL Injection in Email**
```
1. User enters: "test@test.com'; DROP TABLE users; --"
2. System rejects or sanitizes
3. Database not affected
```
**Expected:** Injection prevented  
**Test:** TC-SEC-001

---

**Scenario USEC-002: XSS in Name Field**
```
1. User enters: "<script>alert('XSS')</script>"
2. System sanitizes input
3. Script not executed
```
**Expected:** XSS prevented  
**Test:** TC-SEC-002

---

### Authentication Attacks

**Scenario USEC-003: Token Manipulation**
```
1. User modifies JWT token
2. Tries to use modified token
3. Request rejected
```
**Expected:** Invalid token rejected  
**Test:** TC-SEC-004

---

**Scenario USEC-004: Unauthorized Access**
```
1. User tries to access other user's data
2. Request rejected
3. Error: Unauthorized
```
**Expected:** Access denied  
**Test:** TC-SEC-007

---

**Scenario USEC-005: Rate Limit Bypass**
```
1. User sends 1000 requests in 1 second
2. After limit, requests rejected
3. Rate limit message displayed
```
**Expected:** Rate limiting works  
**Test:** TC-SEC-006

---

## 5. Performance Scenarios ⚡

### Load Scenarios

**Scenario UPERF-001: High Concurrent Users**
```
1. 100 users register simultaneously
2. All requests processed
3. Response time < 1 second
4. No errors
```
**Expected:** Handles load gracefully  
**Test:** TC-PERF-002

---

**Scenario UPERF-002: Large Payload**
```
1. User uploads 10MB image
2. Request processed
3. Response time acceptable
```
**Expected:** Large payloads handled  
**Test:** TC-PERF-003

---

**Scenario UPERF-003: Slow Network**
```
1. User on slow 3G connection
2. Requests timeout appropriately
3. User gets helpful error message
```
**Expected:** Timeout handled gracefully  
**Test:** TC-PERF-004

---

## 6. Business Logic Scenarios 💼

### Booking Logic

**Scenario UBL-001: Booking Conflict**
```
1. User books artist for 2:00 PM
2. Another user tries to book same artist for 2:30 PM
3. System checks availability
4. Second booking rejected or adjusted
```
**Expected:** Conflicts prevented  
**Test:** TC-BOOKING-CONFLICT-001

---

**Scenario UBL-002: Price Calculation**
```
1. User adds service ($50)
2. Adds another service ($30)
3. System calculates: $50 + $30 + booking fee ($5) = $85
4. Total displayed correctly
```
**Expected:** Accurate calculation  
**Test:** TC-CART-007

---

**Scenario UBL-003: Discount Application**
```
1. User applies coupon "SAVE20"
2. System validates coupon
3. Applies 20% discount
4. Total recalculated
```
**Expected:** Discount applied correctly  
**Test:** TC-CART-006

---

**Scenario UBL-004: Refund Processing**
```
1. User cancels booking
2. System calculates refund
3. Refund processed
4. User notified
```
**Expected:** Refund processed correctly  
**Test:** TC-BOOKING-REFUND-001

---

## 7. Unexpected Behaviors 🤔

### User Mistakes

**Scenario UUB-001: Double Click Submit**
```
1. User clicks "Submit" button twice quickly
2. System prevents duplicate submission
3. Only one request processed
```
**Expected:** Duplicate prevention  
**Test:** UUB-001

---

**Scenario UUB-002: Browser Back Button**
```
1. User completes booking
2. Clicks browser back button
3. System handles gracefully
4. No duplicate bookings
```
**Expected:** Back button handled  
**Test:** UUB-002

---

**Scenario UUB-003: App Minimized During Booking**
```
1. User starts booking process
2. Minimizes app
3. Returns after 5 minutes
4. Session still valid or handled appropriately
```
**Expected:** Session management  
**Test:** UUB-003

---

**Scenario UUB-004: Network Interruption**
```
1. User submits form
2. Network disconnects mid-request
3. User reconnects
4. System handles appropriately
```
**Expected:** Network errors handled  
**Test:** UUB-004

---

### System Behaviors

**Scenario UUB-005: Server Restart During Request**
```
1. User sends request
2. Server restarts
3. Request fails gracefully
4. User gets error message
```
**Expected:** Graceful failure  
**Test:** UUB-005

---

**Scenario UUB-006: Database Connection Loss**
```
1. User performs action
2. Database connection lost
3. System retries or fails gracefully
4. User informed
```
**Expected:** Connection loss handled  
**Test:** UUB-006

---

## 📊 Scenario Testing Matrix

| Scenario ID | Category | Priority | Test ID | Status |
|-------------|----------|----------|---------|--------|
| UH-001 | Happy Path | High | TC-AUTH-001 | ⏳ |
| UH-002 | Happy Path | High | TC-AUTH-007 | ⏳ |
| UE-001 | Error | High | TC-AUTH-006 | ⏳ |
| UEC-001 | Edge Case | Medium | EC-001 | ⏳ |
| USEC-001 | Security | Critical | TC-SEC-001 | ⏳ |
| UPERF-001 | Performance | Medium | TC-PERF-002 | ⏳ |
| UBL-001 | Business Logic | High | TC-BOOKING-CONFLICT-001 | ⏳ |
| UUB-001 | Unexpected | Low | UUB-001 | ⏳ |

---

## 🎯 Testing Priority

### Critical (Test First)
- All authentication scenarios
- Security scenarios
- Payment scenarios
- Data integrity scenarios

### High (Test Second)
- Happy path scenarios
- Error scenarios
- Business logic scenarios

### Medium (Test Third)
- Edge cases
- Performance scenarios

### Low (Test Last)
- Unexpected behaviors
- Cosmetic issues

---

## 📝 Test Execution Order

1. **Week 1:** Happy paths (UH-001 to UH-006)
2. **Week 2:** Error scenarios (UE-001 to UE-007)
3. **Week 3:** Edge cases (UEC-001 to UEC-007)
4. **Week 4:** Security (USEC-001 to USEC-005)
5. **Week 5:** Performance (UPERF-001 to UPERF-003)
6. **Week 6:** Business logic (UBL-001 to UBL-004)
7. **Week 7:** Unexpected behaviors (UUB-001 to UUB-006)

---

**Comprehensive user behavior testing guide! 🎯**

