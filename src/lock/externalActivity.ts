// Some flows intentionally send the app to the background — the photo picker,
// camera, share sheet, and document picker all do. Without this guard, the
// app lock would treat that as "left the foreground" and re-lock mid-action,
// unmounting the navigator and wiping the screen the user was on.
//
// A counter (not a boolean) so overlapping/nested activities don't clear each
// other's suppression. The lock's AppState handler consults isLockSuppressed().

let activeCount = 0;

export function isLockSuppressed(): boolean {
  return activeCount > 0;
}

export function beginExternalActivity(): void {
  activeCount += 1;
}

export function endExternalActivity(): void {
  // Defer the decrement so the foreground (`active`) transition that follows
  // the system UI has settled before the lock re-arms. Without the delay a
  // late `background` event could still slip through.
  setTimeout(() => {
    activeCount = Math.max(0, activeCount - 1);
  }, 500);
}

// Run an operation that opens a trusted system UI without tripping the lock.
export async function withExternalActivity<T>(fn: () => Promise<T>): Promise<T> {
  beginExternalActivity();
  try {
    return await fn();
  } finally {
    endExternalActivity();
  }
}
