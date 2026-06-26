import React from 'react';
import { View } from 'react-native';
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
import HomeScreen from './src/screens/HomeScreen';
import NewEntryScreen from './src/screens/NewEntryScreen';
import EntryDetailScreen from './src/screens/EntryDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LockScreen from './src/screens/LockScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Gate({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { ready, lockEnabled, isLocked } = useLock();

  // Hold a plain themed screen until we know the lock preference, so entries
  // never flash before the gate decides.
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }
  if (lockEnabled && isLocked) {
    return <LockScreen />;
  }
  return <>{children}</>;
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
        </Stack.Navigator>
      </NavigationContainer>
    </Gate>
  );
}

export default function App() {
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
