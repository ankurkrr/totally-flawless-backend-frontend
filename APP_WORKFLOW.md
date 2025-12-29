# App Workflow Specification

## 1. Startup Logic (Deterministic)
The application follows a strict startup sequence regardless of previous state (current behavior in `Splash.js`).

**Sequence:**
1.  **Launch**: `Splash.js` (Duration: 2000ms fixed delay)
2.  **Transition**: Automatically resets to `Slider.js` (Onboarding).

## 2. Onboarding Flow (`Slider.js`)
- **Screen**: Carousel with 4 slides.
- **Action**:
    - Swipe Right x 3 OR Click "Learn More" x 3.
    - Button text becomes "Get Started".
    - Click "Get Started".
- **Destination**: `AuthLink.js` (Role Selection).

## 3. Role Selection (`AuthLink.js`)
User chooses their persona.

### A. Client Flow
- **Action**: Click "Login as Client".
- **Destination**: `Login.js` (Params: `userType: 'Client'`).
- **Steps**:
    1.  **Login**: Enter Phone -> Click "Send Code".
    2.  **OTP**: Navigates to `VerifyOTP.js`. Enter "1111".
    3.  **Post-OTP Logic**:
        - **If New User**: -> `Register.js` -> `Home.js`.
        - **If Existing**: -> `Home.js`.

### B. Artist Flow
- **Action**: Click "Login as Artist".
- **Destination**: `Login.js` (Params: `userType: 'Artist'`).
- **Steps**:
    1.  **Login**: Enter Phone -> Click "Send Code".
    2.  **OTP**: Navigates to `VerifyOTP.js`. Enter "1111".
    3.  **Post-OTP Logic**:
        - **If New User**: -> `ArtistLogin.js` (Registration) -> `ApplicationReviewPage`.
        - **If Existing (Approved)**: -> `ArtistHome.js`.
        - **If Existing (Pending/Rejected)**: -> `ApplicationReviewPage`.

### C. Guest Flow
- **Action**: Click "Explore as Guest".
- **Destination**: `Home.js` (Params: `guestUser: true`).

---

# NativeID Audit Report

## Critical Blockers
The following screens require `nativeID` tags to be testable by Espresso.

| Screen | Element | Status | Remediation |
| :--- | :--- | :--- | :--- |
| **ArtistHome.js** | Upcoming Count Container | ❌ MISSING | Add `nativeID="artistUpcoming"` |
| **ArtistHome.js** | Ongoing Count Container | ❌ MISSING | Add `nativeID="artistOngoing"` |
| **ArtistHome.js** | Completed Count Container | ❌ MISSING | Add `nativeID="artistCompleted"` |
| **ArtistHome.js** | Cancelled Count Container | ❌ MISSING | Add `nativeID="artistCancelled"` |
| **Register.js** | First Name Input | ❌ MISSING | Add `nativeID="registerFirstName"` |
| **Register.js** | Last Name Input | ❌ MISSING | Add `nativeID="registerLastName"` |
| **Register.js** | Email Input | ❌ MISSING | Add `nativeID="registerEmail"` |
| **Register.js** | Address Input | ❌ MISSING | Add `nativeID="registerAddress"` |
| **Register.js** | Continue Button | ❌ MISSING | Add `nativeID="registerContinue"` |

## Verified Screens (Safe)
- `Login.js`: `phoneInput`, `loginButton`, `otpInput` (verified).
- `Slider.js`: `getStartedButton` (fixed).
- `AuthLink.js`: `loginAsClient`, `loginAsArtist` (fixed).
- `Home.js`: `homeHeader` (verified).

---

# Espresso Helper Plan

## 1. `AppWorkflow` Helper
A new singleton helper class to encapsulate complex navigation logic.

```kotlin
object AppWorkflow {
    fun navigateToClientLogin() {
        // 1. Handle Slider
        onView(withNativeID("getStartedButton")).perform(click_until_new_screen)
        // 2. Select Role
        onView(withNativeID("loginAsClient")).perform(click())
    }

    fun loginAsClient(phone: String, otp: String) {
        navigateToClientLogin()
        onView(withNativeID("phoneInput")).perform(replaceText(phone))
        onView(withNativeID("loginButton")).perform(click())
        onView(withNativeID("otpInput")).perform(replaceText(otp))
        onView(withNativeID("verifyButton")).perform(click())
    }
}
```

## 2. Dynamic Wait Helpers
Refine `waitForRN` to accept a target view ID.

```kotlin
fun waitForScreen(nativeID: String) {
    device.wait(Until.hasObject(By.tag(nativeID)), 15000)
}
```
