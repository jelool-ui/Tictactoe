import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './state/AppContext.jsx';
import { Toasts } from './components/ui.jsx';
import { Home } from './screens/Home.jsx';
import { SoloSetup } from './screens/SoloSetup.jsx';
import { DuoSetup } from './screens/DuoSetup.jsx';
import { Game } from './screens/Game.jsx';
import { Profile } from './screens/Profile.jsx';
import { Stats } from './screens/Stats.jsx';
import { Trophies } from './screens/Trophies.jsx';
import { History } from './screens/History.jsx';
import { Settings } from './screens/Settings.jsx';
import { Legal } from './screens/Legal.jsx';
import { Tutorial } from './screens/Tutorial.jsx';
import { setAppVisible, unlockAudio } from './audio/audio.js';
import { exitApp, hideSplash, listenAppEvents, styleStatusBar } from './platform/native.js';
import { hideBanner, initAds, onBannerHeight, showBanner } from './ads/adService.js';
import { getTheme } from './themes/themes.js';

const SCREENS = {
  home: Home,
  solo: SoloSetup,
  duo: DuoSetup,
  game: Game,
  profile: Profile,
  stats: Stats,
  trophies: Trophies,
  history: History,
  settings: Settings,
  legal: Legal,
};

// Discreet banner only on non-game screens.
const BANNER_SCREENS = new Set(['home', 'stats', 'history', 'profile', 'trophies']);

export default function App() {
  const { data, updateMeta, effectiveTheme, t, toast } = useApp();
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);
  const current = stack[stack.length - 1];
  const backHandler = useRef(null);
  const lastBackAt = useRef(0);

  const nav = useMemo(
    () => ({
      navigate: (name, params = {}) => setStack((s) => [...s, { name, params }]),
      replace: (name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params }]),
      goBack: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      goHome: () => setStack([{ name: 'home', params: {} }]),
      /** Opens a screen directly above Home (Back returns to Home). */
      reset: (name, params = {}) => setStack([{ name: 'home', params: {} }, { name, params }]),
    }),
    [],
  );

  const registerBack = useCallback((fn) => {
    backHandler.current = fn;
    return () => {
      if (backHandler.current === fn) backHandler.current = null;
    };
  }, []);

  // Reset back handler when screen changes; scroll to top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current]);

  const stackRef = useRef(stack);
  stackRef.current = stack;
  const tutorialRef = useRef(!data.meta.tutorialDone);
  tutorialRef.current = !data.meta.tutorialDone;

  // Native lifecycle: back button, pause/resume.
  useEffect(() => {
    let cleanup = () => {};
    listenAppEvents({
      onBack: () => {
        if (tutorialRef.current) return updateMeta({ tutorialDone: true });
        if (document.querySelector('.modal-backdrop')) {
          document.querySelector('.modal-backdrop')?.click();
          return undefined;
        }
        if (stackRef.current[stackRef.current.length - 1].name === 'game' && backHandler.current?.()) return undefined;
        if (stackRef.current.length > 1) return nav.goBack();
        const now = Date.now();
        if (now - lastBackAt.current < 2000) exitApp();
        else {
          lastBackAt.current = now;
          toast(t('common.exitHint'));
        }
        return undefined;
      },
      onActiveChange: (active) => setAppVisible(active),
    }).then((fn) => (cleanup = fn));
    return () => cleanup();
  }, [nav, t, toast, updateMeta]);

  // First paint done → hide the native splash screen. Initialize ads in the background.
  useEffect(() => {
    requestAnimationFrame(() => hideSplash());
    onBannerHeight((h) => document.documentElement.style.setProperty('--banner-h', `${h}px`));
    const id = setTimeout(() => initAds(), 1200);
    // Unlock Web Audio on the first user gesture (autoplay policy).
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    return () => clearTimeout(id);
  }, []);

  // Status bar follows the theme.
  useEffect(() => {
    const th = getTheme(effectiveTheme);
    styleStatusBar(th.vars['--bg-solid'], th.dark);
  }, [effectiveTheme]);

  // Banner visibility per screen (never during a game or the tutorial).
  const bannerWanted = BANNER_SCREENS.has(current.name) && data.meta.tutorialDone;
  useEffect(() => {
    if (bannerWanted) showBanner();
    else hideBanner();
  }, [bannerWanted]);

  const ScreenComponent = SCREENS[current.name] ?? Home;

  return (
    <div className="app">
      <ScreenComponent
        key={stack.length + current.name}
        nav={nav}
        params={current.params}
        registerBack={registerBack}
      />
      {!data.meta.tutorialDone && <Tutorial onDone={() => updateMeta({ tutorialDone: true })} />}
      <Toasts />
    </div>
  );
}
