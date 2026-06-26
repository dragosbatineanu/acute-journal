import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { RootStackParamList } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useLock } from '../lock/LockContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { theme, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { lockEnabled, setLockEnabled } = useLock();
  const [busy, setBusy] = useState(false);

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
        <Text style={styles.sectionLabel}>Appearance</Text>
        <TouchableOpacity style={styles.row} onPress={toggle} activeOpacity={0.7}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Theme</Text>
            <Text style={styles.rowHint}>Currently {mode === 'dark' ? 'dark' : 'light'}.</Text>
          </View>
          <Text style={styles.rowValue}>{mode === 'dark' ? '☾' : '☀'}</Text>
        </TouchableOpacity>
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
});
