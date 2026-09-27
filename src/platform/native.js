/** Native platform glue (Android): splash screen, status bar, back button, app lifecycle. */
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

export async function hideSplash() {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}

export async function styleStatusBar(color, dark) {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color });
  } catch {
    /* ignore (not supported on every Android version) */
  }
}

/** Subscribes to the Android back button and app pause/resume. Returns a cleanup function. */
export async function listenAppEvents({ onBack, onActiveChange }) {
  if (!isNative()) {
    const vis = () => onActiveChange(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }
  const { App } = await import('@capacitor/app');
  const handles = await Promise.all([
    App.addListener('backButton', () => onBack()),
    App.addListener('appStateChange', ({ isActive }) => onActiveChange(isActive)),
  ]);
  return () => handles.forEach((h) => h.remove());
}

export async function exitApp() {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  App.exitApp();
}
