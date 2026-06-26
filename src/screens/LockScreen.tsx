import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useLock } from '../lock/LockContext';

export default function LockScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { unlock } = useLock();
  const [authenticating, setAuthenticating] = useState(false);
  // Guards against overlapping prompts (auto-prompt on mount + a fast tap).
  const inFlight = useRef(false);

  const prompt = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Acute',
        cancelLabel: 'Cancel',
      });
      if (result.success) unlock();
    } finally {
      inFlight.current = false;
      setAuthenticating(false);
    }
  }, [unlock]);

  useEffect(() => {
    // Only prompt while the app is in the foreground. We lock on 'background',
    // so without this guard the biometric prompt would fire as the app is being
    // minimised — flashing the system unlock UI during the exit animation.
    // Instead we wait until the app returns to 'active'.
    if (AppState.currentState === 'active') {
      prompt();
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') prompt();
    });
    return () => sub.remove();
  }, [prompt]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.center}>
        <View style={styles.badge}>
          <Text style={styles.glyph}>🔒</Text>
        </View>
        <Text style={styles.title}>Acute is locked</Text>
        <Text style={styles.hint}>Your journal is private.</Text>
        <TouchableOpacity
          style={[styles.btn, authenticating && { opacity: 0.6 }]}
          onPress={prompt}
          disabled={authenticating}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{authenticating ? 'Unlocking…' : 'Unlock'}</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  glyph: {
    fontSize: 30,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.xl,
  },
  btn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  btnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
});
