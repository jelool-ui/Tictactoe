/** Persisted application data model + migration. */
import { defaultSettings } from '../settings/settings.js';
import { defaultProfile } from '../profile/profile.js';
import { defaultStats } from '../stats/stats.js';
import { defaultCosmetics } from '../cosmetics/cosmetics.js';
import { THEMES, DEFAULT_THEME } from '../themes/themes.js';
import { LANGUAGES } from '../i18n/languages.js';

export const DATA_VERSION = 1;

export const defaultData = (language) => ({
  version: DATA_VERSION,
  settings: defaultSettings(language),
  profile: defaultProfile(),
  stats: defaultStats(),
  achievements: {}, // id -> unlock timestamp
  history: [],
  cosmetics: defaultCosmetics(),
  meta: {
    tutorialDone: false,
    lastDifficulty: 'intermediate',
    lastDuo: null, // { p1, p2, starter, p1Symbol }
    ads: { gamesSinceInterstitial: 0, lastInterstitialAt: 0 },
  },
});

/** Merges stored data over defaults so new fields added in updates are always present. */
export function hydrate(stored, language) {
  const base = defaultData(language);
  if (!stored || typeof stored !== 'object') return base;
  const data = {
    ...base,
    ...stored,
    settings: { ...base.settings, ...stored.settings },
    profile: { ...base.profile, ...stored.profile },
    stats: {
      ...base.stats,
      ...stored.stats,
      winsByLevel: { ...base.stats.winsByLevel, ...stored.stats?.winsByLevel },
      aiLevelGames: { ...base.stats.aiLevelGames, ...stored.stats?.aiLevelGames },
    },
    achievements: { ...stored.achievements },
    history: Array.isArray(stored.history) ? stored.history : [],
    cosmetics: { ...base.cosmetics, ...stored.cosmetics, unlocks: { ...stored.cosmetics?.unlocks } },
    meta: { ...base.meta, ...stored.meta, ads: { ...base.meta.ads, ...stored.meta?.ads } },
    version: DATA_VERSION,
  };
  if (!LANGUAGES.some((l) => l.code === data.settings.language)) data.settings.language = language;
  if (!THEMES.some((t) => t.id === data.settings.theme)) data.settings.theme = DEFAULT_THEME;
  return data;
}
