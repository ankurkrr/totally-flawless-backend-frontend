# Push Notifications Setup Guide

## Current Status

Push notifications have been **temporarily disabled** to allow the iOS build to succeed. The original `AppDelegate.mm` had push notification code that required the `@react-native-community/push-notification-ios` package, which was not installed.

## Changes Made

### 1. Podfile (`ios/Podfile`)
Removed the following line that was added but couldn't resolve:
```ruby
pod 'RNCPushNotificationIOS', :path => '../node_modules/@react-native-community/push-notification-ios'
```

### 2. AppDelegate.mm (`ios/flawless/AppDelegate.mm`)
Commented out the following import:
```objc
// #import <RNCPushNotificationIOS.h>
```

Commented out the following delegate methods:
- `application:didRegisterForRemoteNotificationsWithDeviceToken:`
- `application:didReceiveRemoteNotification:fetchCompletionHandler:`
- `application:didFailToRegisterForRemoteNotificationsWithError:`
- `userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:`

---

## How to Re-enable Push Notifications

### Step 1: Install the npm package

Due to dependency conflicts in the project, you'll need to use the `--legacy-peer-deps` flag:

```bash
cd /Users/leandrovallejos/Desktop/Resources/ElevationAI/TotallyFlawless/totally-flawless-frontend/tf-frontend
npm install @react-native-community/push-notification-ios --legacy-peer-deps
```

**Note:** The dependency conflict is caused by `react-native-ui-datepicker@2.0.12` requiring `react-native-web` which has conflicting peer dependencies with your current React version (18.2.0 vs 19.2.3).

### Step 2: Update the Podfile

Add this line inside the `target 'flawless' do` block in `ios/Podfile`:

```ruby
pod 'RNCPushNotificationIOS', :path => '../node_modules/@react-native-community/push-notification-ios'
```

### Step 3: Restore AppDelegate.mm

Uncomment the import at the top of `ios/flawless/AppDelegate.mm`:
```objc
#import <RNCPushNotificationIOS.h>
```

Restore the delegate methods (replace the commented section):
```objc
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the notification event.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
}
```

### Step 4: Reinstall Pods

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Step 5: Configure Push Notifications in Xcode

1. Open `ios/flawless.xcworkspace` in Xcode
2. Select the `flawless` target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Push Notifications"
5. Also add "Background Modes" and check "Remote notifications"

### Step 6: Apple Developer Portal Setup

1. Log into [Apple Developer Portal](https://developer.apple.com)
2. Create an APNs Key or Certificate for push notifications
3. Configure your app's App ID to enable Push Notifications
4. Download and configure the key/certificate with your push notification service (e.g., Firebase Cloud Messaging, OneSignal, etc.)

---

## Dependency Conflict Details

When attempting to install `@react-native-community/push-notification-ios`, npm reported:

```
npm error ERESOLVE could not resolve
npm error While resolving: react-native-ui-datepicker@2.0.12
npm error Found: react@18.2.0
npm error Could not resolve dependency:
npm error peer react-native-web@"*" from react-native-ui-datepicker@2.0.12
npm error Conflicting peer dependency: react@19.2.3
```

**Potential Solutions:**
1. Use `--legacy-peer-deps` flag (quick fix)
2. Downgrade `react-native-ui-datepicker` to a version compatible with your React version
3. Remove `react-native-ui-datepicker` if not essential
4. Update all packages to be compatible with React 19 (major undertaking)

---

## Additional Resources

- [react-native-community/push-notification-ios Documentation](https://github.com/react-native-push-notification/ios)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging for iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)

