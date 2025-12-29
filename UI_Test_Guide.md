Android Espresso Test Generation Plan
Goal Description
Generate production-ready Espresso UI test cases for the "Totally Flawless" React Native Android application. The tests will cover Smoke, Authentication, Navigation, RecyclerView (Lists), and Permissions. Tests will be written in Kotlin and placed in tf-frontend/android/app/src/androidTest/java/com/flawless/.

User Review Required
IMPORTANT

Dependencies: The
android/app/build.gradle
file is missing androidTestImplementation dependencies for Espresso and UIAutomator. I will add them. Package Name: Assumed com.flawless based on AndroidManifest.xml. Async Handling: Since this is a black-box React Native test, I will use UiDevice.wait and waitForView loops instead of complex IdlingResources which require JS-bridge instrumentation. This ensures stability without touching JS code.

Proposed Changes
Configuration
[MODIFY]
build.gradle
Add androidTestImplementation dependencies:
androidx.test.ext:junit:1.1.5
androidx.test.espresso:espresso-core:3.5.1
androidx.test.uiautomator:uiautomator:2.3.0
androidx.test:rules:1.5.0
Test Files
All files specific to com.flawless package.

[NEW]
SmokeTest.kt
Goal: Verify app launches and displays the initial screen.
Steps: Launch Activity -> Check for "Login with mobile number" or Splash screen elements.
[NEW]
AuthenticationTest.kt
Goal: Verify Login flow.
Steps:
Enter Country Code +1.
Enter Phone 9999999999.
Click "Send Code".
Verify navigation to OTP screen (check for "Verify OTP" text).
[NEW]
NavigationTest.kt
Goal: Verify basic navigation.
Steps:
From Login, check Back button behavior.
If possible to bypass login (mock), check Bottom navigation on Home. Note: Verification might be limited to Auth stack if bypass is hard.
[NEW]
RecyclerViewTest.kt
Goal: Verify List interactions.
Steps:
Use UserBookings or
Home
service list.
Scroll to an item.
Click an item.
[NEW]
PermissionsTest.kt
Goal: Handle System Dialogs.
Steps:
Trigger action requiring permission (e.g., Notification on Home).
Use UiDevice to find "Allow" button and click it.
Verification Plan
Automated Tests
Run the following command in the terminal (I will run this for you if you approve):

cd tf-frontend/android
./gradlew connectedAndroidTest
Note: This requires an emulator or device to be connected. If none is connected, the build will succeed but tests will skip.

Manual Verification
Open Android Studio.
Right-click com.flawless in androidTest.
Select "Run 'Tests in com.flawless'".