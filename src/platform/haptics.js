/** Haptic feedback — native on Android via @capacitor/haptics, web fallback via navigator.vibrate. */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let enabled = true;
export const setHapticsEnabled = (value) => {
  enabled = !!value;
};

const native = () => Capacitor.isNativePlatform();
const webVibrate = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
};

const PATTERNS = {
  move: () => (native() ? Haptics.impact({ style: ImpactStyle.Light }) : webVibrate(12)),
  win: () => (native() ? Haptics.notification({ type: NotificationType.Success }) : webVibrate([30, 60, 30])),
  loss: () => (native() ? Haptics.notification({ type: NotificationType.Error }) : webVibrate([60, 40, 60])),
  draw: () => (native() ? Haptics.impact({ style: ImpactStyle.Medium }) : webVibrate(40)),
  trophy: () => (native() ? Haptics.impact({ style: ImpactStyle.Heavy }) : webVibrate([20, 40, 20, 40, 60])),
};

export function vibrate(kind) {
  if (!enabled) return;
  try {
    const p = PATTERNS[kind]?.();
    p?.catch?.(() => {});
  } catch {
    /* never crash on haptics */
  }
}
