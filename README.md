# Acute

A minimalist journaling app for capturing acute moments — built with React Native and Expo. Instead of a blank page, Acute asks three focused questions so each entry has a feeling, a meaning, and a next step.

> **What happened?** · **What did it mean?** · **What now?**

Everything is stored locally on your device. No account, no sync, no servers.

## Features

- **Three-question entries** — a guided structure that turns a moment into a reflection.
- **Moods** — tag each entry with one of ten color-coded moods (Calm, Good, Low, Frustrated, Anxious, Determined, Uncertain, Grateful, Numb, Intense).
- **Custom tags** — add free-form tags with suggestions drawn from tags you've used before.
- **Important moments** — star entries to mark and filter the ones that matter.
- **Photo attachments** — add photos from your library or camera to an entry (up to six). Images are downscaled and compressed on device, shown as a gallery with tap-to-zoom, and included in backups.
- **Search & filter** — full-text search across entries plus quick filter chips for moods, important, and tags.
- **Light & dark themes** — a warm-paper light theme and a dark theme, toggled from Settings (or the home header) and remembered between launches.
- **App lock** — optionally gate the app behind your device credentials (fingerprint, face unlock, or PIN/pattern). Re-locks whenever the app leaves the foreground, so your journal is also hidden in the app switcher. Toggle it in Settings.
- **Backup & restore** — export all entries (photos included) to a JSON file you can save or share, and import one back later. Imports are merged in and duplicates are skipped, so restoring is non-destructive. Backup files are unencrypted plain text.
- **Tactile feel** — haptic feedback and subtle spring animations on saving and selecting a mood.
- **Private by design** — entries live in on-device storage (`AsyncStorage`); nothing leaves the phone.

## Tech stack

- [Expo](https://expo.dev/) SDK 54
- [React Native](https://reactnative.dev/) 0.81 / [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [React Navigation](https://reactnavigation.org/) (native stack)
- [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) for persistence
- [`expo-haptics`](https://docs.expo.dev/versions/v54.0.0/sdk/haptics/) for feedback
- [`expo-local-authentication`](https://docs.expo.dev/versions/v54.0.0/sdk/local-authentication/) for the app lock
- [`expo-file-system`](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/), [`expo-sharing`](https://docs.expo.dev/versions/v54.0.0/sdk/sharing/), and [`expo-document-picker`](https://docs.expo.dev/versions/v54.0.0/sdk/document-picker/) for backup export & import
- [`expo-image-picker`](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/) and [`expo-image-manipulator`](https://docs.expo.dev/versions/v54.0.0/sdk/imagemanipulator/) for photo attachments

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- The [Expo Go](https://expo.dev/go) app on your iOS or Android device, or an emulator/simulator

### Install

```sh
npm install
```

### Run

```sh
npm start        # start the Metro bundler, then scan the QR code with Expo Go
npm run android  # open on an Android emulator/device
npm run ios      # open on an iOS simulator (macOS only)
npm run web      # run in the browser
```

## Project structure

```
App.tsx                     # Providers, lock gate, navigation container, status bar
src/
  components/
    EntryCard.tsx           # Entry preview card (mood, date, tags, photo thumb)
    MoodPicker.tsx          # Horizontal mood selector with a select animation
    TagInput.tsx            # Tag editor with chips and suggestions
  lock/
    LockContext.tsx         # App-lock state, persistence, re-lock on background
  screens/
    HomeScreen.tsx          # Entry list, search, and filter chips
    NewEntryScreen.tsx      # Create/edit an entry
    EntryDetailScreen.tsx   # Read a full entry
    SettingsScreen.tsx      # App lock, theme, and backup settings
    LockScreen.tsx          # Biometric/credential unlock screen
  storage/
    entries.ts              # AsyncStorage CRUD and tag helpers
    backup.ts               # Export, import, and validation of backup files
    photos.ts               # Pick, compress, persist, and clean up photo files
  theme/
    index.ts                # Color palettes and design tokens
    ThemeContext.tsx        # Theme provider, useTheme hook, persistence
  types/
    index.ts                # JournalEntry, Mood, navigation types
  utils/
    date.ts                 # Date formatting helpers
```

## Roadmap

Ideas not yet built:

- Daily writing streak and reminders
- Mood trends over time
- Calendar / timeline view
- "On this day" resurfacing
- Voice-to-text capture
- Editable / custom moods
- Writing stats

## License

Released under the [MIT License](LICENSE).
