import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hydrate, defaultData } from './model.js';
import * as storage from '../storage/storage.js';
import { detectLanguage, directionOf } from '../i18n/languages.js';
import { createT } from '../i18n/i18n.js';
import { applyResult, defaultStats } from '../stats/stats.js';
import { pointsFor } from '../stats/scoring.js';
import { newlyUnlocked } from '../achievements/achievements.js';
import { addEntry } from '../history/history.js';
import { applyTheme } from '../themes/themes.js';
import { isUnlocked } from '../cosmetics/cosmetics.js';
import { configureAudio } from '../audio/audio.js';
import { setHapticsEnabled } from '../platform/haptics.js';

const AppContext = createContext(null);

function initialData() {
  return hydrate(storage.loadSync(), detectLanguage());
}

export function AppProvider({ children }) {
  const [data, setData] = useState(initialData);
  const dataRef = useRef(data);
  dataRef.current = data;

  // If the WebView copy was lost but the native copy exists, restore it.
  useEffect(() => {
    if (storage.loadSync()) return;
    storage.loadNative().then((native) => {
      if (native) setData(hydrate(native, detectLanguage()));
    });
  }, []);

  // Persist on every change (data is small; synchronous localStorage write).
  useEffect(() => {
    storage.save(data);
  }, [data]);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = fn(prev);
      dataRef.current = next;
      return next;
    });
  }, []);

  const { settings, cosmetics } = data;

  // Language + RTL
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = settings.language;
    root.dir = directionOf(settings.language);
  }, [settings.language]);

  // Theme (fallback to default if a reward theme expired)
  const effectiveTheme = isUnlocked(cosmetics, settings.theme) ? settings.theme : 'night';
  useLayoutEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme]);

  // Audio + haptics preferences
  useEffect(() => {
    configureAudio(settings);
  }, [settings.sound, settings.music, settings.volume]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setHapticsEnabled(settings.vibration), [settings.vibration]);

  const t = useMemo(() => createT(settings.language), [settings.language]);

  // ---------------------------------------------------------------- toasts
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, icon) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-2), { id, message, icon }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 2600);
  }, []);

  // ---------------------------------------------------------------- actions
  const actions = useMemo(
    () => ({
      updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      updateProfile: (patch) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } })),
      updateMeta: (patch) => update((d) => ({ ...d, meta: { ...d.meta, ...patch } })),
      updateCosmetics: (fn) => update((d) => ({ ...d, cosmetics: fn(d.cosmetics) })),

      /**
       * Records a finished game. Returns { points, unlocked, snapshot } where snapshot
       * allows the result to be rolled back (second chance).
       */
      recordGame: (result) => {
        const prev = dataRef.current;
        const points = pointsFor(result);
        const timestamp = Date.now();
        const stats = applyResult(prev.stats, { ...result, points });
        const unlockedIds = newlyUnlocked(stats, prev.achievements);
        const achievements = { ...prev.achievements };
        unlockedIds.forEach((id) => (achievements[id] = timestamp));
        const history = addEntry(prev.history, {
          timestamp,
          mode: result.mode,
          difficulty: result.difficulty ?? null,
          opponent: result.opponent,
          outcome: result.outcome,
          winnerName: result.winnerName ?? null,
          points,
          durationMs: result.durationMs,
        });
        const ads = { ...prev.meta.ads, gamesSinceInterstitial: prev.meta.ads.gamesSinceInterstitial + 1 };
        const snapshot = { stats: prev.stats, history: prev.history, achievements: prev.achievements };
        update((d) => ({ ...d, stats, achievements, history, meta: { ...d.meta, ads } }));
        return { points, unlocked: unlockedIds, snapshot };
      },

      rollbackGame: (snapshot) =>
        update((d) => ({
          ...d,
          stats: snapshot.stats,
          history: snapshot.history,
          achievements: snapshot.achievements,
        })),

      markInterstitialShown: () =>
        update((d) => ({
          ...d,
          meta: { ...d.meta, ads: { gamesSinceInterstitial: 0, lastInterstitialAt: Date.now() } },
        })),

      clearHistory: () => update((d) => ({ ...d, history: [] })),
      resetStats: () => update((d) => ({ ...d, stats: defaultStats(), achievements: {} })),
      resetData: () => {
        storage.clear();
        update((d) => defaultData(detectLanguage()));
      },
    }),
    [update],
  );

  const value = useMemo(
    () => ({ data, t, lang: settings.language, toast, toasts, effectiveTheme, getData: () => dataRef.current, ...actions }),
    [data, t, settings.language, toast, toasts, effectiveTheme, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
