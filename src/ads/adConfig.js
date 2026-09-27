/**
 * AdMob configuration.
 *
 * DEVELOPMENT: Google's official test IDs are used (safe, no invalid traffic).
 * PRODUCTION:  set VITE_ADMOB_USE_TEST_IDS=false and your real unit IDs in
 *              `.env.production.local` (see .env.production.example), and the
 *              AdMob APP ID in android/gradle.properties (ADMOB_APP_ID).
 */
const env = import.meta.env ?? {};

export const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/9214589741', // adaptive banner
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

const useTestIds = env.VITE_ADMOB_USE_TEST_IDS !== 'false';

export const AD_CONFIG = {
  enabled: env.VITE_ADS_ENABLED !== 'false',
  isTesting: useTestIds,
  ids: useTestIds
    ? TEST_IDS
    : {
        banner: env.VITE_ADMOB_BANNER_ID || '',
        interstitial: env.VITE_ADMOB_INTERSTITIAL_ID || '',
        rewarded: env.VITE_ADMOB_REWARDED_ID || '',
      },
  // Interstitial pacing — deliberately conservative.
  interstitial: {
    everyNGames: 4, // at most once every 4 finished games
    minIntervalMs: 4 * 60 * 1000, // and never more than once every 4 minutes
    graceGames: 3, // never during the very first games of a new player
  },
};
