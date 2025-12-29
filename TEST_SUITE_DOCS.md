# Hardened Espresso Test Suite

## Overview
This test suite addresses the flakiness and `NoMatchingViewException` errors caused by React Native's asynchronous view rendering and the app's onboarding flow.

## Key Architectural Changes

### 1. Hybrid Synchronization (`BaseTest.kt`)
Standard Espresso `onView()` calls fail because React Native views differ from Android's expected lifecycle. We implemented a **Hybrid Synchronization** layer:

```kotlin
protected fun waitForRN(timeout: Long = 15000) {
    device.wait(Until.hasObject(By.desc("getStartedButton")), timeout)
}
```
This uses `UiAutomator` to wait for the React Native view hierarchy to hydrate *before* Espresso asserts against it.

### 2. Strict ID Matching
We abandoned text-based matching (weak) for strict `nativeID` matching:
- **React Native**: `nativeID="myID"` (mapped to Android View Tag)
- **Espresso**: `onView(withTagValue(is("myID")))`

### 3. Automated Onboarding Flow
The app launches into an onboarding carousel, not the login screen. Tests now reflect reality using `completeOnboarding()`:
1.  Clicks ("Learn More" -> "Get Started") through the carousel.
2.  Selects "Login as Client".
3.  Arrives at Login Screen for test execution.

## Validated Scenarios

| Test Class | Scenario | Description |
| :--- | :--- | :--- |
| `AuthenticationTest` | Login Flow | Validates Input -> OTP -> Home Screen transition. |
| `RecyclerViewTest` | Service Lists | Validates Makeup/Hair service cards on Home Screen using unique tag IDs. |
| `NavigationTest` | Logout | Validates Drawer -> Logout -> Login Screen flow. |

## CI Execution
Run the full suite:
```bash
cd tf-frontend/android && ./gradlew clean connectedAndroidTest
```
