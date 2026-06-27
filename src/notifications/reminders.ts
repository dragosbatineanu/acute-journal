import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = '@acute:reminder';
const ANDROID_CHANNEL = 'daily-reminder';

export interface ReminderPref {
  enabled: boolean;
  hour: number; // 0–23
  minute: number; // 0–59
}

// 9:00 PM — a sensible default end-of-day reflection time.
export const DEFAULT_REMINDER: ReminderPref = { enabled: false, hour: 21, minute: 0 };

export async function loadReminderPref(): Promise<ReminderPref> {
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      hour: clampInt(parsed.hour, 0, 23, DEFAULT_REMINDER.hour),
      minute: clampInt(parsed.minute, 0, 59, DEFAULT_REMINDER.minute),
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

export async function saveReminderPref(pref: ReminderPref): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify(pref)).catch(() => {});
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

// Set the foreground presentation behavior and, on Android, the notification
// channel. Safe to call once at launch.
export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Ask for notification permission, prompting only if we still can. Returns
// whether we ended up granted.
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Replace any existing schedule with a single daily reminder. We own every
// scheduled notification in this app, so clearing all keeps it from piling up
// duplicates across reschedules.
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Acute',
      body: 'Take a moment to capture today.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ANDROID_CHANNEL,
    },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Re-assert the saved schedule on cold launch without prompting — the OS keeps
// daily triggers across launches, but rescheduling makes the state authoritative
// and self-heals if it was ever cleared. Stays silent if permission was revoked.
export async function syncReminderOnLaunch(): Promise<void> {
  const pref = await loadReminderPref();
  if (!pref.enabled) return;
  const perms = await Notifications.getPermissionsAsync();
  if (perms.granted) {
    await scheduleDailyReminder(pref.hour, pref.minute);
  }
}
