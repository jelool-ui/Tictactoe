/**
 * Local persistence.
 * - localStorage gives synchronous reads at startup (no flash, no white screen).
 * - On Android, every write is mirrored to Capacitor Preferences (native SharedPreferences)
 *   so data survives even if the WebView storage is cleared by the system.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const STORAGE_KEY = 'ttd.data.v1';

const isNative = () => Capacitor.isNativePlatform();

export function loadSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Reads the native copy (used when the WebView copy is missing). */
export async function loadNative() {
  if (!isNative()) return null;
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function save(data) {
  const raw = JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage full or unavailable — native copy below still applies */
  }
  if (isNative()) Preferences.set({ key: STORAGE_KEY, value: raw }).catch(() => {});
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (isNative()) Preferences.remove({ key: STORAGE_KEY }).catch(() => {});
}
