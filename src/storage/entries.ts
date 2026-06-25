import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '../types';

const KEY = '@acute:entries';

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: JournalEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function addEntry(entry: JournalEntry): Promise<JournalEntry[]> {
  const all = await loadEntries();
  const updated = [entry, ...all];
  await saveEntries(updated);
  return updated;
}

export async function updateEntry(entry: JournalEntry): Promise<JournalEntry[]> {
  const all = await loadEntries();
  const updated = all.map((e) => (e.id === entry.id ? entry : e));
  await saveEntries(updated);
  return updated;
}

export async function deleteEntry(id: string): Promise<JournalEntry[]> {
  const all = await loadEntries();
  const updated = all.filter((e) => e.id !== id);
  await saveEntries(updated);
  return updated;
}
