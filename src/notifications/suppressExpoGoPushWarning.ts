import { LogBox } from 'react-native';

// expo-notifications auto-registers a push-token listener the moment it is
// imported (its TokenAutoRegistration side effect). On Expo Go for Android
// (SDK 53+) that registration logs a warning that *remote* push was removed
// from Expo Go — even though we only schedule *local* notifications, which still
// work there. The message is harmless and never appears in a real build, so we
// silence just this one known string to keep it from surfacing as a red LogBox
// error in development.
//
// This module is imported before App (and therefore before expo-notifications)
// in index.ts so the filter is registered before the warning can fire.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
]);
