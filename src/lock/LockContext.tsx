import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@acute:lockEnabled';

interface LockContextValue {
  // False until we've read the stored preference, so the gate can avoid
  // flashing entries before it knows whether the lock is on.
  ready: boolean;
  lockEnabled: boolean;
  isLocked: boolean;
  setLockEnabled: (value: boolean) => Promise<void>;
  unlock: () => void;
}

const LockContext = createContext<LockContextValue>({
  ready: false,
  lockEnabled: false,
  isLocked: false,
  setLockEnabled: async () => {},
  unlock: () => {},
});

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lockEnabled, setLockEnabledState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  // The AppState listener is registered once and reads the latest value here,
  // rather than re-subscribing every time the preference changes.
  const lockEnabledRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      const enabled = saved === 'true';
      lockEnabledRef.current = enabled;
      setLockEnabledState(enabled);
      setIsLocked(enabled); // start locked on cold launch when enabled
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      // Re-arm the lock whenever the app leaves the foreground. We deliberately
      // ignore 'inactive' so the system biometric prompt — which briefly makes
      // the app inactive on iOS — doesn't re-lock us mid-authentication.
      if (next === 'background' && lockEnabledRef.current) {
        setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  async function setLockEnabled(value: boolean) {
    lockEnabledRef.current = value;
    setLockEnabledState(value);
    // Toggling from Settings (already past the gate) should never strand the
    // user behind a lock screen.
    setIsLocked(false);
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false').catch(() => {});
  }

  function unlock() {
    setIsLocked(false);
  }

  return (
    <LockContext.Provider value={{ ready, lockEnabled, isLocked, setLockEnabled, unlock }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  return useContext(LockContext);
}
