export const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

export const FALLBACK_LANGUAGE = 'en';

/** Detects the device language (first launch). */
export function detectLanguage(navigatorLike = globalThis.navigator) {
  const candidates = [...(navigatorLike?.languages ?? []), navigatorLike?.language].filter(Boolean);
  for (const tag of candidates) {
    const code = String(tag).toLowerCase().split(/[-_]/)[0];
    if (LANGUAGES.some((l) => l.code === code)) return code;
  }
  return FALLBACK_LANGUAGE;
}

export const directionOf = (code) => LANGUAGES.find((l) => l.code === code)?.dir ?? 'ltr';
