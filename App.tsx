import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/types';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { LockProvider, useLock } from './src/lock/LockContext';
import { configureNotifications, syncReminderOnLaunch } from './src/notifications/reminders';
import HomeScreen from './src/screens/HomeScreen';
import NewEntryScreen from './src/screens/NewEntryScreen';
import EntryDetailScreen from './src/screens/EntryDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import LockScreen from './src/screens/LockScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Gate({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { ready, lockEnabled, isLocked } = useLock();

  // Render the lock as an opaque overlay rather than swapping the navigator out,
  // so re-locking on background (or a system handoff) never unmounts the screen
  // the user was on — an in-progress entry survives the lock. Until we know the
  // lock preference, a plain themed cover hides everything so entries never flash.
  const covered = !ready || (lockEnabled && isLocked);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {covered && (
        <View style={StyleSheet.absoluteFill}>
          {ready ? (
            <LockScreen />
          ) : (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
          )}
        </View>
      )}
    </View>
  );
}

function Root() {
  const { theme, mode } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  return (
    // A themed backdrop behind the whole navigator. Without it, the native
    // screen transition can briefly expose the host window (white) as the
    // outgoing screen slides away.
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Gate>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewEntry" component={NewEntryScreen} />
            <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </Gate>
    </View>
  );
}

export default function App() {
  // Set up the notification handler/channel, then re-assert any saved daily
  // reminder so the schedule survives reinstalls and OS housekeeping.
  React.useEffect(() => {
    configureNotifications().then(syncReminderOnLaunch);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LockProvider>
          <Root />
        </LockProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
