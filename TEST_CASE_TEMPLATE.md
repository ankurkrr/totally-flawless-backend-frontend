# 📋 Test Case Template

Use this template for documenting each test case.

---

## Basic Information

**Test ID:** `TC-XXX`  
**Module:** `[Module Name]`  
**Feature:** `[Feature Name]`  
**Endpoint:** `[HTTP Method] [Endpoint Path]`  
**Priority:** `High / Medium / Low`  
**Test Type:** `Functional / Integration / Security / Performance / Edge Case`  
**Created:** `YYYY-MM-DD`  
**Last Updated:** `YYYY-MM-DD`  
**Assigned To:** `[Tester Name]`

---

## Test Description

**What does this test validate?**
```
[Clear description of what this test is checking]
```

**Why is this test important?**
```
[Business impact, user impact, risk if not tested]
```

---

## Prerequisites

- [ ] Server is running
- [ ] Database is accessible
- [ ] Environment variables are set
- [ ] Test data is prepared
- [ ] Previous test dependencies completed

**Specific Prerequisites:**
```
[List any specific setup needed]
```

---

## Test Data

### Input Data
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Expected Database State (Before)
```
[What should exist in DB before test]
```

### Expected Database State (After)
```
[What should exist in DB after test]
```

---

## Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Action description] | [Expected outcome] |
| 2 | [Action description] | [Expected outcome] |
| 3 | [Action description] | [Expected outcome] |

**Detailed Steps:**
1. [Step 1 with details]
2. [Step 2 with details]
3. [Step 3 with details]

---

## Expected Results

### Response Status
- **HTTP Status Code:** `200 / 201 / 400 / 401 / 404 / 500`
- **Response Time:** `< 500ms`

### Response Body Structure
```json
{
  "status": "success",
  "data": {
    "id": "...",
    "accessToken": "..."
  }
}
```

### Response Validation Checklist
- [ ] Status code matches expected
- [ ] Response structure matches schema
- [ ] Required fields present
- [ ] Data types correct
- [ ] Values match expected
- [ ] Token is valid JWT (if applicable)
- [ ] Database updated correctly

### Business Logic Validation
- [ ] [Business rule 1]
- [ ] [Business rule 2]
- [ ] [Business rule 3]

---

## Actual Results

**Test Execution Date:** `YYYY-MM-DD HH:MM:SS`  
**Test Environment:** `Development / Staging / Production`  
**Tester:** `[Name]`

### Response Received
```json
{
  "actual": "response"
}
```

### Status
- [ ] ✅ **PASS** - All validations passed
- [ ] ❌ **FAIL** - One or more validations failed
- [ ] ⚠️ **PARTIAL** - Some validations passed, some failed
- [ ] ⏸️ **BLOCKED** - Cannot execute due to dependencies
- [ ] 🔄 **RETEST** - Fixed and needs retesting

### Issues Found
| Issue | Severity | Description |
|-------|----------|-------------|
| Issue 1 | High/Medium/Low | Description |

### Screenshots/Logs
- [Link to screenshot]
- [Link to logs]
- [Link to Postman collection run]

---

## Edge Cases Tested

| Edge Case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| Empty string | `""` | Rejected | - | ⏳ |
| Null value | `null` | Rejected | - | ⏳ |
| Very long string | `10000 chars` | Truncated | - | ⏳ |
| Special characters | `!@#$%` | Handled | - | ⏳ |

---

## Related Test Cases

**Dependencies:**
- `TC-XXX` - Must pass before this test

**Related Tests:**
- `TC-XXX` - Similar functionality
- `TC-XXX` - Opposite scenario

**Regression Tests:**
- `TC-XXX` - Previous bug fix

---

## Notes & Observations

```
[Any additional observations, patterns noticed, potential improvements, etc.]
```

---

## Postman Collection Reference

**Collection:** `[Collection Name]`  
**Request Name:** `[Request Name]`  
**Environment:** `[Environment Name]`

**Pre-request Script:**
```javascript
// Any setup needed
```

**Test Script:**
```javascript
// Validation logic
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

---

## Sign-off

**Tested By:** `[Name]` - `[Date]`  
**Reviewed By:** `[Name]` - `[Date]`  
**Approved By:** `[Name]` - `[Date]`

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| YYYY-MM-DD | 1.0 | Initial creation | [Name] |
| YYYY-MM-DD | 1.1 | Updated after fix | [Name] |

