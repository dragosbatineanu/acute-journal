import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useLock } from '../lock/LockContext';
import { exportBackup, importBackup } from '../storage/backup';
import {
  ReminderPref,
  DEFAULT_REMINDER,
  loadReminderPref,
  saveReminderPref,
  scheduleDailyReminder,
  cancelReminder,
  ensureNotificationPermission,
} from '../notifications/reminders';

// Format an hour/minute as a localized clock time, e.g. "9:00 PM".
function formatTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { theme, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { lockEnabled, setLockEnabled } = useLock();
  const [busy, setBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [reminder, setReminder] = useState<ReminderPref>(DEFAULT_REMINDER);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadReminderPref().then(setReminder);
  }, []);

  async function onToggleReminder(next: boolean) {
    if (reminderBusy) return;
    setReminderBusy(true);
    try {
      if (next) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notifications are off',
            'Allow notifications for Acute in your device settings to get a daily reminder.'
          );
          return;
        }
        await scheduleDailyReminder(reminder.hour, reminder.minute);
      } else {
        await cancelReminder();
      }
      const updated = { ...reminder, enabled: next };
      setReminder(updated);
      await saveReminderPref(updated);
    } finally {
      setReminderBusy(false);
    }
  }

  async function onChangeTime(event: DateTimePickerEvent, date?: Date) {
    // Android shows a modal dialog that dismisses itself; iOS renders inline.
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (event.type === 'dismissed' || !date) return;
    const updated = { ...reminder, hour: date.getHours(), minute: date.getMinutes() };
    setReminder(updated);
    await saveReminderPref(updated);
    if (updated.enabled) await scheduleDailyReminder(updated.hour, updated.minute);
  }

  async function onToggleLock(next: boolean) {
    if (busy) return;
    if (!next) {
      await setLockEnabled(false);
      return;
    }
    setBusy(true);
    try {
      // SecurityLevel.NONE means the device has no passcode/biometrics at all,
      // so there's nothing for us to authenticate against.
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert(
          'No device security',
          'Set up a passcode, fingerprint, or Face ID in your device settings first, then enable the lock.'
        );
        return;
      }
      // Confirm the user can actually pass the lock before committing to it.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable app lock',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        await setLockEnabled(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onExport() {
    if (dataBusy) return;
    setDataBusy(true);
    try {
      const res = await exportBackup();
      if (res.status === 'empty') {
        Alert.alert('Nothing to export', 'Write an entry first, then back it up.');
      } else if (res.status === 'unavailable') {
        Alert.alert('Sharing unavailable', 'This device can’t share files.');
      }
    } catch {
      Alert.alert('Export failed', 'Something went wrong creating the backup.');
    } finally {
      setDataBusy(false);
    }
  }

  async function onImport() {
    if (dataBusy) return;
    setDataBusy(true);
    try {
      const res = await importBackup();
      if (res.canceled) return;
      const parts = [`${res.added} added`];
      if (res.skipped) parts.push(`${res.skipped} already present`);
      if (res.invalid) parts.push(`${res.invalid} skipped (invalid)`);
      Alert.alert('Import complete', `${parts.join(', ')}.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read that file.';
      Alert.alert('Import failed', message);
    } finally {
      setDataBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Insights</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Insights')}
          activeOpacity={0.7}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Mood distribution</Text>
            <Text style={styles.rowHint}>See your mood mix across all entries or the last 30 days.</Text>
          </View>
          <Text style={styles.rowValue}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>App lock</Text>
            <Text style={styles.rowHint}>
              Require Face ID, fingerprint, or your passcode to open Acute.
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={onToggleLock}
            disabled={busy}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Reminders</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Daily reminder</Text>
            <Text style={styles.rowHint}>A gentle nudge to capture your day.</Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={onToggleReminder}
            disabled={reminderBusy}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
        {reminder.enabled && (
          <TouchableOpacity
            style={[styles.row, styles.rowStacked]}
            onPress={() => setShowTimePicker((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Time</Text>
              <Text style={styles.rowHint}>When to send the reminder each day.</Text>
            </View>
            <Text style={styles.rowValue}>{formatTime(reminder.hour, reminder.minute)}</Text>
          </TouchableOpacity>
        )}
        {reminder.enabled && showTimePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={(() => {
                const d = new Date();
                d.setHours(reminder.hour, reminder.minute, 0, 0);
                return d;
              })()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
              themeVariant={mode}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <TouchableOpacity style={styles.row} onPress={toggle} activeOpacity={0.7}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Theme</Text>
            <Text style={styles.rowHint}>Currently {mode === 'dark' ? 'dark' : 'light'}.</Text>
          </View>
          <Text style={styles.rowValue}>{mode === 'dark' ? '☾' : '☀'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Data</Text>
        <TouchableOpacity
          style={[styles.row, dataBusy && styles.rowDisabled]}
          onPress={onExport}
          disabled={dataBusy}
          activeOpacity={0.7}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Export backup</Text>
            <Text style={styles.rowHint}>Save all entries to a JSON file you can share or store.</Text>
          </View>
          <Text style={styles.rowValue}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, styles.rowStacked, dataBusy && styles.rowDisabled]}
          onPress={onImport}
          disabled={dataBusy}
          activeOpacity={0.7}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Import backup</Text>
            <Text style={styles.rowHint}>Restore from a backup file. New entries are merged in; duplicates are skipped.</Text>
          </View>
          <Text style={styles.rowValue}>↘</Text>
        </TouchableOpacity>
        <Text style={styles.sectionFooter}>
          Backup files are unencrypted — anyone with the file can read your entries and photos.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: theme.colors.text,
  },
  screenTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  section: {
    paddingTop: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.subtext,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowStacked: {
    // Avoid a doubled divider where two rows sit back to back.
    borderTopWidth: 0,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  rowHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    lineHeight: 16,
  },
  rowValue: {
    fontSize: 20,
    color: theme.colors.subtext,
  },
  pickerWrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  sectionFooter: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    lineHeight: 16,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
});
