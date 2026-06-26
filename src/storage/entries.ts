import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '../types';

const KEY = '@acute:entries';

const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 30;

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Trim, drop empties, cap length, dedupe case-insensitively (keeping the
// first display casing), and cap the total count.
export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const trimmed = tag.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

// Union of all tags across entries, sorted alphabetically (case-insensitive).
export function getAllTags(entries: JournalEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export async function loadEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: JournalEntry[] = raw ? JSON.parse(raw) : [];
    // Older entries predate tags; ensure the field is always an array.
    return parsed.map((e) => ({ ...e, tags: Array.isArray(e.tags) ? e.tags : [] }));
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
