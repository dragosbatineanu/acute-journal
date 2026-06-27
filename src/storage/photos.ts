import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { withExternalActivity } from '../lock/externalActivity';

const PHOTO_PREFIX = 'photo-';
// Longest-edge cap and JPEG quality applied before a photo is stored. Keeps
// both on-device footprint and (base64) backup size in check.
const MAX_EDGE = 1600;
const COMPRESS = 0.7;

export const MAX_PHOTOS_PER_ENTRY = 6;

export type PickResult =
  | { status: 'added'; filenames: string[] }
  | { status: 'canceled' }
  | { status: 'denied'; source: 'camera' | 'library' };

// Photos are stored as bare filenames; the absolute document-dir path can
// change across reinstalls, so we always rebuild the URI on demand.
export function photoUri(filename: string): string {
  return new File(Paths.document, filename).uri;
}

function newPhotoFilename(): string {
  return `${PHOTO_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

// Downscale (never upscale) + compress to JPEG, then persist into the document
// directory. Returns the stored filename.
async function persistImage(uri: string, width?: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (width && width > MAX_EDGE) {
    ctx.resize({ width: MAX_EDGE });
  }
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: COMPRESS });

  const filename = newPhotoFilename();
  new File(saved.uri).copy(new File(Paths.document, filename));
  // The manipulator output lives in cache; drop it now that it's copied.
  try {
    new File(saved.uri).delete();
  } catch {
    // Best-effort cleanup; cache is reclaimed by the OS regardless.
  }
  return filename;
}

async function persistAssets(
  assets: ImagePicker.ImagePickerAsset[],
  limit: number
): Promise<string[]> {
  const filenames: string[] = [];
  for (const asset of assets.slice(0, limit)) {
    filenames.push(await persistImage(asset.uri, asset.width));
  }
  return filenames;
}

export async function pickFromLibrary(remaining: number): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'denied', source: 'library' };

  const result = await withExternalActivity(() =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    })
  );
  if (result.canceled) return { status: 'canceled' };

  return { status: 'added', filenames: await persistAssets(result.assets, remaining) };
}

export async function takePhoto(): Promise<PickResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { status: 'denied', source: 'camera' };

  const result = await withExternalActivity(() => ImagePicker.launchCameraAsync({ quality: 1 }));
  if (result.canceled) return { status: 'canceled' };

  return { status: 'added', filenames: await persistAssets(result.assets, 1) };
}

// Best-effort delete of stored photo files. A missing or locked file must never
// block the user action that triggered the cleanup.
export function deletePhotos(filenames: string[]): void {
  for (const name of filenames) {
    try {
      const file = new File(Paths.document, name);
      if (file.exists) file.delete();
    } catch {
      // ignore
    }
  }
}

// On edit, remove only the files that were attached before but no longer are.
export function cleanupRemovedPhotos(before: string[], after: string[]): void {
  const keep = new Set(after);
  deletePhotos(before.filter((name) => !keep.has(name)));
}

// Read a stored photo as base64 for embedding in a backup. Returns null if the
// file is missing so a stale reference can't abort the whole export.
export async function readPhotoBase64(filename: string): Promise<string | null> {
  try {
    const file = new File(Paths.document, filename);
    if (!file.exists) return null;
    return await file.base64();
  } catch {
    return null;
  }
}

// Write a base64 photo (from an imported backup) into the document directory.
// The new File API can't write base64, so this is the one spot using legacy FS.
export async function writePhotoBase64(base64: string): Promise<string> {
  const filename = newPhotoFilename();
  const dest = new File(Paths.document, filename);
  await LegacyFS.writeAsStringAsync(dest.uri, base64, {
    encoding: LegacyFS.EncodingType.Base64,
  });
  return filename;
}
