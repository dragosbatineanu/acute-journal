import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { JournalEntry, Mood, MOODS } from '../types';
import { createId, loadEntries, normalizeTags, saveEntries } from './entries';
import { MAX_PHOTOS_PER_ENTRY, readPhotoBase64, writePhotoBase64 } from './photos';
import { withExternalActivity } from '../lock/externalActivity';

// Bump SCHEMA whenever the on-disk entry shape changes so a future importer
// can detect and migrate older backups instead of silently mis-reading them.
const SCHEMA = 1;
const APP_ID = 'acute';

// In a backup, photos travel as base64 blobs rather than filenames, since
// filenames reference files that only exist on the originating device.
type ExportEntry = Omit<JournalEntry, 'photos'> & { photosData: string[] };

interface BackupFile {
  app: string;
  schema: number;
  exportedAt: string;
  entries: ExportEntry[];
}

function backupFileName(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `acute-backup-${y}-${m}-${d}.json`;
}

export type ExportResult =
  | { status: 'shared'; count: number }
  | { status: 'empty'; count: 0 }
  | { status: 'unavailable'; count: number };

export async function exportBackup(): Promise<ExportResult> {
  const entries = await loadEntries();
  if (entries.length === 0) {
    return { status: 'empty', count: 0 };
  }

  // Inline each entry's photos as base64 so the backup is fully self-contained.
  const exportEntries: ExportEntry[] = [];
  for (const entry of entries) {
    const photosData: string[] = [];
    for (const name of entry.photos) {
      const b64 = await readPhotoBase64(name);
      if (b64) photosData.push(b64); // skip references whose file is missing
    }
    const { photos, ...rest } = entry;
    exportEntries.push({ ...rest, photosData });
  }

  const payload: BackupFile = {
    app: APP_ID,
    schema: SCHEMA,
    exportedAt: new Date().toISOString(),
    entries: exportEntries,
  };

  const file = new File(Paths.cache, backupFileName());
  // Overwrite any earlier backup written today.
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    return { status: 'unavailable', count: entries.length };
  }

  await withExternalActivity(() =>
    Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Acute backup',
      UTI: 'public.json',
    })
  );
  return { status: 'shared', count: entries.length };
}

export interface ImportResult {
  canceled: boolean;
  added: number;
  skipped: number; // already present (matched by id)
  invalid: number; // malformed entries dropped during parsing
  total: number; // total entries after the merge
}

// Imported files are untrusted: they may be hand-edited, truncated, or from a
// different/future version. Every field is validated and anything malformed is
// dropped rather than allowed to corrupt the store.
function coerceMood(raw: unknown): Mood | null {
  if (!raw || typeof raw !== 'object') return null;
  const { emoji, label, color } = raw as Record<string, unknown>;
  if (typeof label !== 'string') return null;
  // Prefer the app's canonical mood so emoji/color stay consistent.
  const known = MOODS.find((m) => m.label.toLowerCase() === label.toLowerCase());
  if (known) return known;
  if (typeof emoji === 'string' && typeof color === 'string') {
    return { emoji, label, color };
  }
  return null;
}

function coercePhotosData(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.length > 0) out.push(item);
    if (out.length >= MAX_PHOTOS_PER_ENTRY) break;
  }
  return out;
}

interface ParsedEntry {
  entry: JournalEntry;
  photosData: string[];
}

function coerceEntry(raw: unknown): ParsedEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const mood = coerceMood(r.mood);
  if (!mood) return null;
  if (typeof r.createdAt !== 'string') return null;

  const happened = typeof r.happened === 'string' ? r.happened : '';
  const meaning = typeof r.meaning === 'string' ? r.meaning : '';
  const next = typeof r.next === 'string' ? r.next : '';
  // An entry with no text in any of the three questions is noise.
  if (!happened && !meaning && !next) return null;

  return {
    entry: {
      id: typeof r.id === 'string' && r.id ? r.id : createId(),
      createdAt: r.createdAt,
      happened,
      meaning,
      next,
      mood,
      important: r.important === true,
      tags: normalizeTags(Array.isArray(r.tags) ? (r.tags as string[]) : []),
      photos: [], // resolved from photosData only for entries we keep
    },
    photosData: coercePhotosData(r.photosData),
  };
}

function parseBackup(text: string): { items: ParsedEntry[]; invalid: number } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file isn’t valid JSON.');
  }

  // Accept our wrapper { entries: [...] } or, leniently, a bare entries array.
  const rawEntries = Array.isArray(data)
    ? data
    : Array.isArray((data as { entries?: unknown })?.entries)
      ? (data as { entries: unknown[] }).entries
      : null;
  if (!rawEntries) {
    throw new Error('This doesn’t look like an Acute backup.');
  }

  let invalid = 0;
  const items: ParsedEntry[] = [];
  for (const raw of rawEntries) {
    const parsed = coerceEntry(raw);
    if (parsed) items.push(parsed);
    else invalid++;
  }
  return { items, invalid };
}

export async function importBackup(): Promise<ImportResult> {
  const empty: ImportResult = { canceled: true, added: 0, skipped: 0, invalid: 0, total: 0 };

  const picked = await withExternalActivity(() =>
    DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    })
  );
  if (picked.canceled) return empty;

  const file = new File(picked.assets[0].uri);
  const { items, invalid } = parseBackup(await file.text());

  // Merge, skipping duplicates by id (non-destructive restore).
  const current = await loadEntries();
  const ids = new Set(current.map((e) => e.id));
  const merged = [...current];
  let added = 0;
  let skipped = 0;
  for (const { entry, photosData } of items) {
    if (ids.has(entry.id)) {
      skipped++;
      continue;
    }
    // Write photo files only for entries we actually keep, so a skipped
    // duplicate never leaves orphaned image files behind.
    const photos: string[] = [];
    for (const b64 of photosData) {
      try {
        photos.push(await writePhotoBase64(b64));
      } catch {
        // Skip a single bad photo rather than failing the whole import.
      }
    }
    entry.photos = photos;
    ids.add(entry.id);
    merged.push(entry);
    added++;
  }

  // Keep newest-first (ISO timestamps sort lexicographically) to match the app.
  merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  await saveEntries(merged);

  return { canceled: false, added, skipped, invalid, total: merged.length };
}
