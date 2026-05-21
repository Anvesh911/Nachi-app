# 🎙️ Nachi — Expo React Native

Personal call memory app. Converted from Flutter → **Expo React Native** with full EAS Build support for cloud APK generation.

---

## 📁 Project Structure

```
nachi-expo/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout, font loading, navigation
│   ├── index.tsx                 # Splash screen → auto-redirects to lock
│   ├── lock.tsx                  # PIN + biometric lock screen
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab nav + FAB record button
│   │   ├── index.tsx             # Home: search, filter, conversation list
│   │   └── starred.tsx           # Starred conversations
│   └── detail/
│       └── [id].tsx              # Conversation detail: audio, summary, transcript
│
├── src/
│   ├── theme/index.ts            # Colors, typography, spacing (from Flutter NachiColors)
│   ├── services/
│   │   ├── types.ts              # TypeScript types + demo data
│   │   ├── database.ts           # expo-sqlite (converted from sqflite)
│   │   ├── recordingService.ts   # expo-av Audio (converted from record pkg)
│   │   ├── authService.ts        # expo-local-authentication + expo-secure-store
│   │   └── aiService.ts          # OpenAI Whisper + GPT-4o mini
│   ├── store/useStore.ts         # Zustand (converted from Flutter Riverpod)
│   ├── components/index.tsx      # ConvCard, Avatar, GlassCard, TagBadge, etc.
│   └── screens/RecordingSheet.tsx # Recording modal with live waveform
│
├── app.json                      # Expo config + Android permissions
├── eas.json                      # EAS Build profiles (preview APK, production AAB)
├── package.json
├── babel.config.js
└── tsconfig.json
```

---

## 🔄 Flutter → React Native Conversion Map

| Flutter | React Native / Expo |
|---|---|
| `StatefulWidget` | Functional component + hooks |
| `AnimationController` | `Animated.Value` + `Animated.loop` |
| `Navigator.push` | `router.push` (Expo Router) |
| `Riverpod` StateNotifier | `Zustand` store |
| `sqflite` | `expo-sqlite` |
| `record` package | `expo-av` Audio.Recording |
| `local_auth` | `expo-local-authentication` |
| `flutter_secure_storage` | `expo-secure-store` |
| `share_plus` | `react-native Share` |
| `ListView.builder` | `FlashList` (@shopify/flash-list) |
| `BottomAppBar + FAB` | Custom tab bar with center FAB |
| `TabController` | State + animated underline |
| `showModalBottomSheet` | `Modal` + sheet component |
| `Slider` | Custom progress bar + `TouchableOpacity` |
| `MaterialApp theme` | `src/theme/index.ts` design tokens |
| `Column/Row` | `View` with flexDirection |
| `SizedBox` | `gap` / `marginBottom` |
| `Padding` | `padding` in StyleSheet |
| `Container` | `View` |
| `Text` widget | `Text` component |
| `GestureDetector` | `TouchableOpacity` / `Pressable` |

---

## 🚀 Local Setup

### 1. Prerequisites

```bash
node -v        # 18+
npm -v         # 9+
npx expo --version  # 52+
```

### 2. Install

```bash
git clone https://github.com/yourname/nachi-expo.git
cd nachi-expo
npm install
```

### 3. Add missing font package

```bash
npx expo install @expo-google-fonts/sora expo-navigation-bar
```

### 4. Run in dev (Expo Go / dev client)

```bash
npx expo start
# Press 'a' for Android emulator
# Scan QR with Expo Go app on device
```

---

## ☁️ EAS Cloud Build (APK — no local Android SDK needed)

This is the main advantage over Flutter: **build APK in the cloud**, no Android Studio required.

### Step 1 — Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2 — Create Expo account & login

```bash
eas login
# Or: https://expo.dev/signup
```

### Step 3 — Link project to EAS

```bash
eas init
# This adds your EAS projectId to app.json automatically
```

### Step 4 — Build APK (preview profile)

```bash
eas build --platform android --profile preview
```

- ✅ No Android SDK required on your machine
- ✅ Builds in Expo's cloud servers (~5–10 min)
- ✅ Downloads a `.apk` file you can sideload directly
- ✅ Free tier: 30 builds/month

### Step 5 — Download & Install APK

After build completes, EAS gives you a QR code and download link.
On your Android device:
1. Enable **Install unknown apps** in Settings → Security
2. Open the APK download link
3. Tap Install

---

## 📦 All Build Profiles

| Profile | Command | Output | Use Case |
|---|---|---|---|
| `preview` | `eas build --platform android --profile preview` | `.apk` | Internal testing, sideload |
| `production` | `eas build --platform android --profile production` | `.aab` | Google Play Store |
| `development` | `eas build --platform android --profile development` | `.apk` | Dev client with hot reload |
| `local-apk` | `eas build --platform android --profile local-apk --local` | `.apk` | Local machine (needs Android SDK) |

---

## 🔑 API Keys (Optional — for AI features)

Create `src/services/config.ts`:

```ts
export const Config = {
  openAiKey: 'sk-YOUR_KEY_HERE', // Whisper + GPT-4o mini
};
```

Without an API key, the app works fully with:
- Demo data loaded on first launch
- Recording saves audio to device
- Manual transcript review

---

## 📱 Android Permissions (app.json)

| Permission | Purpose |
|---|---|
| `RECORD_AUDIO` | Microphone for recording |
| `READ_PHONE_STATE` | Detect call start/end |
| `READ_CALL_LOG` | Auto-fill contact name |
| `WRITE_EXTERNAL_STORAGE` | Save audio (API < 29) |
| `USE_BIOMETRIC` | Fingerprint unlock |
| `INTERNET` | AI API calls (optional) |
| `SCHEDULE_EXACT_ALARM` | Reminder notifications |

---

## 🏗️ Submit to Google Play

```bash
# 1. Build production AAB
eas build --platform android --profile production

# 2. Submit to Play Store internal track
eas submit --platform android
# (Requires google-service-account.json — see EAS docs)
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#070B14` |
| Surface | `#0D1117` |
| Primary (neon blue) | `#00B4FF` |
| Accent (purple) | `#7C5CFC` |
| Success | `#55EFC4` |
| Danger | `#FF4757` |
| Font | Sora (400/600/700/800) |
| Border radius | 8–24px |

---

## 🔐 Demo PIN

**1234**

---

## 📋 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 52 + React Native 0.76 |
| Routing | Expo Router 4 (file-based) |
| State | Zustand |
| Database | expo-sqlite (SQLite) |
| Audio | expo-av |
| Auth | expo-local-authentication + expo-secure-store |
| Lists | @shopify/flash-list |
| Fonts | @expo-google-fonts/sora |
| Build | EAS Build (cloud APK/AAB) |
| AI | OpenAI Whisper + GPT-4o mini |
| TypeScript | 5.3+ |
