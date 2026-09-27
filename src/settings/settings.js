import { DEFAULT_THEME } from '../themes/themes.js';

export const defaultSettings = (language = 'en') => ({
  language,
  sound: true,
  music: true,
  volume: 0.8, // 0..1 — sound effects volume (music stays much quieter)
  timer: true,
  theme: DEFAULT_THEME,
  vibration: true,
});
