# 🎙️ Nachi — Personal Call Memory App

**Nachi** is a privacy-first Android app for recording conversations, converting speech to text, and generating AI summaries — all stored locally on your device.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎙️ Call Recording | Record any conversation with one tap, consent-first flow |
| 📝 Speech-to-Text | Whisper AI (online) or Android on-device STT (offline) |
| 🤖 AI Summary | Key points, promises, dates, tone — powered by GPT-4o mini |
| 🔍 Smart Search | Search by keyword across all transcripts and contacts |
| 🔐 App Lock | PIN + fingerprint biometric authentication |
| 💾 Local Storage | SQLite (Room) + encrypted local file storage, no cloud |
| ⭐ Starred | Favorite important conversations for quick access |
| 📤 Export | Share transcript as PDF or plain text |
| 🔔 Reminders | Create reminders from conversation promises |

---

## 🏗️ Architecture

```
lib/
├── main.dart                          # Entry point + Splash
├── core/
│   ├── database/
│   │   └── database_helper.dart       # SQLite via sqflite
│   ├── encryption/
│   │   └── encryption_service.dart    # AES-256 local encryption
│   └── services/
│       ├── recording_service.dart     # Audio recording (record pkg)
│       ├── transcription_service.dart # Whisper API + on-device STT
│       └── ai_summary_service.dart    # GPT-4o mini summarization
├── features/
│   ├── auth/
│   │   └── lock_screen.dart           # PIN + biometric auth
│   ├── home/
│   │   └── home_screen.dart           # Home, search, filter
│   ├── recording/
│   │   └── recording_sheet.dart       # Record modal + waveform
│   └── detail/
│       └── detail_screen.dart         # Summary, transcript, reminders
└── shared/
    └── theme/
        └── app_theme.dart             # Colors, fonts, Material 3 theme
```

---

## 🚀 Setup & Installation

### Prerequisites
- Flutter 3.19+ (`flutter --version`)
- Android Studio / VS Code with Flutter plugin
- Android device or emulator (API 24+)
- (Optional) OpenAI API key for Whisper + GPT-4o mini

### 1. Clone & Install
```bash
git clone https://github.com/yourname/nachi.git
cd nachi
flutter pub get
```

### 2. Configure API Keys (optional)
Create `lib/core/config/api_config.dart`:
```dart
class ApiConfig {
  static const openAiKey = 'sk-YOUR_KEY_HERE'; // For Whisper + AI summary
}
```

### 3. Run (debug)
```bash
flutter run
```

### 4. Build Release APK
```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore ~/nachi-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nachi

# Create android/key.properties
cat > android/key.properties << EOF
storePassword=YOUR_STORE_PASS
keyPassword=YOUR_KEY_PASS
keyAlias=nachi
storeFile=/Users/yourname/nachi-release.jks
EOF

# Build APK
flutter build apk --release --split-per-abi

# Output: build/app/outputs/flutter-apk/
#   app-arm64-v8a-release.apk   ← recommended for modern phones
#   app-armeabi-v7a-release.apk ← for older phones
#   app-x86_64-release.apk      ← for emulators
```

### 5. Build App Bundle (for Play Store)
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

---

## 📱 Android Permissions

| Permission | Purpose |
|---|---|
| `RECORD_AUDIO` | Microphone access for recording |
| `READ_PHONE_STATE` | Detect call start/end |
| `READ_CALL_LOG` | Auto-fill contact name |
| `WRITE/READ_EXTERNAL_STORAGE` | Save audio files |
| `USE_BIOMETRIC` | Fingerprint unlock |
| `INTERNET` | Whisper API + AI summary (optional) |
| `SCHEDULE_EXACT_ALARM` | Reminder notifications |

---

## 🔐 Privacy & Security

- **No cloud upload by default** — all data stays on device
- **AES-256 encryption** for stored audio and transcripts
- **Consent dialog** before every recording
- **App lock** with PIN + biometrics
- **Delete/export** controls fully in user's hands
- Compliant with **Indian IT Act, 2000** consent requirements

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| UI | Flutter 3 + Material 3 + flutter_animate |
| State | Riverpod |
| Database | sqflite (SQLite) |
| Recording | record package |
| Speech-to-Text | speech_to_text (on-device) + OpenAI Whisper |
| AI Summary | GPT-4o mini via HTTP |
| Encryption | encrypt (AES-256) + flutter_secure_storage |
| Auth | local_auth (fingerprint/face) |
| PDF Export | pdf + printing packages |
| Fonts | Sora (Google Fonts) |

---

## 🎨 Design System

- **Theme:** Dark, black + neon blue
- **Font:** Sora (800 weight for headings)
- **Colors:**
  - Background: `#070B14`
  - Surface: `#0D1117`
  - Primary: `#00B4FF` (neon blue)
  - Accent: `#7C5CFC` (purple)
  - Success: `#55EFC4`
  - Danger: `#FF4757`
- **Border radius:** 14–28px (rounded cards)
- **Glassmorphism:** Translucent surfaces with colored borders

---

## 📋 Demo PIN

The demo PIN is **1234**

---

## 📄 License

MIT License © 2026 Nachi
