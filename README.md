# Totally Flawless - Mobile Application

Welcome to the **Totally Flawless** React Native mobile application repository. This project is a comprehensive beauty service booking platform connecting users with professional artists.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Architecture](#-project-architecture)
- [Running the App](#-running-the-app)
- [Building for Production](#-building-for-production)
- [Scripts Reference](#-scripts-reference)
- [Troubleshooting](#-troubleshooting)

---

## 📖 About the Project

Totally Flawless is designed to provide a seamless scheduling and booking experience for beauty services. The application supports two distinct user roles:
- **Clients:** Browse services, book appointments, view portfolios, and manage bookings.
- **Artists:** Manage schedules, view requests, track earnings, and showcase work.

---

## 🛠 Tech Stack

**Core Frameworks:**
- [React Native](https://reactnative.dev/) (v0.73.2)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux](https://redux.js.org/) / Redux Thunk (State Management)

**Key Libraries:**
- **Navigation:** `@react-navigation/native`
- **Networking:** `axios`, `rn-fetch-blob`
- **UI/UX:** `react-native-reanimated`, `react-native-size-matters`, `@rneui/themed`
- **Maps:** `react-native-maps`, `react-native-geolocation-service`
- **Payments:** `@stripe/stripe-react-native`
- **Media:** `react-native-video`, `react-native-image-picker`

---

## ✅ Prerequisites

Ensure your development environment is set up with the following:

- **Node.js** (>= 18.0.0)
- **JDK** (Java Development Kit) 17
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Watchman** (recommended for Metro bundler performance)

---

## 🚀 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd tf-frontend
    ```

2.  **Install Dependencies:**
    > **Note:** We use `--legacy-peer-deps` to handle specific dependency resolutions.
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **iOS Dependency Setup (macOS only):**
    ```bash
    cd ios && pod install && cd ..
    # or use the script
    npm run pod
    ```

---

## 📂 Project Architecture

The project follows a scalable feature-based directory structure within `src/`:

```
src/
├── assets/          # Static assets (images, fonts, local videos)
├── components/      # Reusable UI components (Buttons, Cards, Loaders)
├── constants/       # App-wide constants (Enums, Configs, Strings)
├── Navigation/      # React Navigation setup (Stacks, Tabs, Drawer)
├── screens/         # Feature screens (Auth, Booking, Profile, etc.)
├── services/        # API services, Utilities, helper functions
├── store/           # Redux setup (Actions, Reducers, Store config)
├── style/           # Global styles and themes
└── types/           # TypeScript type definitions and interfaces
```

---

## 🏃 Running the App

### 1. Start Metro Bundler
Start the Javascript bundler server in a dedicated terminal:
```bash
npm start
```

### 2. Run on Device/Emulator

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

---

## 📦 Building for Production

### Android

**Generate APK (Release Mode):**
```bash
npm run apk
```
_Output:_ `android/app/build/outputs/apk/release/app-release.apk`

**Generate AAB (Play Store Release):**
```bash
npm run aab
```
_Output:_ `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📜 Scripts Reference

Here are the custom scripts defined in `package.json`:

| Script | Description |
| :--- | :--- |
| `npm start` | Starts the Metro bundler. |
| `npm run android` | Builds and installs the Debug app on Android. |
| `npm run ios` | Builds and installs the Debug app on iOS simulator. |
| `npm run apk` | Generates a Release APK. |
| `npm run aab` | Clean build & generates a Release Android App Bundle (AAB). |
| `npm run andClean` | Cleans the Android build directory (`gradlew clean`). |
| `npm run pod` | Installs CocoaPods dependencies (iOS). |
| `npm run lint` | Runs `eslint` to check code quality. |
| `npm test` | Runs Jest unit tests. |

---

## 🔧 Troubleshooting

**1. Metro Bundler Issues:**
If you encounter caching issues or "Unable to resolve module", try starting with reset cache:
```bash
npm start -- --reset-cache
```

**2. Android Build Failures:**
Clean the build folder and try again:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**3. iOS Pod Issues:**
If pods fall out of sync:
```bash
cd ios
rm -rf Pods
rm Podfile.lock
pod install
cd ..
```

---
**Maintained by the Flawless Engineering Team**
