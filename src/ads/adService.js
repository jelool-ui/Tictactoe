/**
 * AdMob service — a thin, crash-proof wrapper around @capacitor-community/admob.
 * Every call is a no-op on the web / when ads are disabled, and every error is swallowed:
 * the game must keep working offline or when no ad is available.
 */
import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from './adConfig.js';

let AdMob = null;
let mod = null;
let initialized = false;
let initPromise = null;
let interstitialReady = false;
let rewardedReady = false;
let bannerVisible = false;
let bannerHeightListener = () => {};

export const adsSupported = () => AD_CONFIG.enabled && Capacitor.isNativePlatform();

async function loadPlugin() {
  if (!mod) mod = await import('@capacitor-community/admob');
  AdMob = mod.AdMob;
  return mod;
}

/** Initializes AdMob + UMP consent (GDPR). Safe to call multiple times. */
export function initAds() {
  if (!adsSupported()) return Promise.resolve(false);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await loadPlugin();
      await AdMob.initialize({ initializeForTesting: AD_CONFIG.isTesting });
      try {
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === mod.AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
      } catch {
        /* consent unavailable offline — ads will simply not load */
      }
      AdMob.addListener(mod.BannerAdPluginEvents.SizeChanged, (size) => {
        bannerHeightListener(bannerVisible ? size?.height || 0 : 0);
      });
      AdMob.addListener(mod.BannerAdPluginEvents.FailedToLoad, () => bannerHeightListener(0));
      AdMob.addListener(mod.InterstitialAdPluginEvents.Dismissed, () => {
        interstitialReady = false;
        prepareInterstitial();
      });
      AdMob.addListener(mod.InterstitialAdPluginEvents.FailedToLoad, () => {
        interstitialReady = false;
      });
      AdMob.addListener(mod.RewardAdPluginEvents.FailedToLoad, () => {
        rewardedReady = false;
      });
      initialized = true;
      prepareInterstitial();
      prepareRewarded();
      return true;
    } catch {
      initialized = false;
      initPromise = null; // allow a later retry (e.g. when back online)
      return false;
    }
  })();
  return initPromise;
}

/** Registers a callback receiving the banner height in px (0 when hidden). */
export function onBannerHeight(cb) {
  bannerHeightListener = cb || (() => {});
}

export async function showBanner() {
  if (!adsSupported() || !AD_CONFIG.ids.banner) return;
  if (!(await initAds())) return;
  try {
    bannerVisible = true;
    await AdMob.showBanner({
      adId: AD_CONFIG.ids.banner,
      adSize: mod.BannerAdSize.ADAPTIVE_BANNER,
      position: mod.BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: AD_CONFIG.isTesting,
    });
  } catch {
    bannerVisible = false;
    bannerHeightListener(0);
  }
}

export async function hideBanner() {
  bannerVisible = false;
  bannerHeightListener(0);
  if (!initialized) return;
  try {
    await AdMob.hideBanner();
  } catch {
    /* ignore */
  }
}

async function prepareInterstitial() {
  if (!initialized || interstitialReady || !AD_CONFIG.ids.interstitial) return;
  try {
    await AdMob.prepareInterstitial({ adId: AD_CONFIG.ids.interstitial, isTesting: AD_CONFIG.isTesting });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

async function prepareRewarded() {
  if (!initialized || rewardedReady || !AD_CONFIG.ids.rewarded) return;
  try {
    await AdMob.prepareRewardVideoAd({ adId: AD_CONFIG.ids.rewarded, isTesting: AD_CONFIG.isTesting });
    rewardedReady = true;
  } catch {
    rewardedReady = false;
  }
}

/** Shows an interstitial if one is ready. Resolves true if it was shown. Never throws. */
export async function showInterstitial() {
  if (!initialized || !interstitialReady) {
    prepareInterstitial();
    return false;
  }
  try {
    interstitialReady = false;
    await AdMob.showInterstitial();
    return true;
  } catch {
    prepareInterstitial();
    return false;
  }
}

/** True if a rewarded ad can be offered to the player right now. */
export const rewardedAvailable = () => initialized && rewardedReady;

/**
 * Shows a voluntary rewarded ad. Resolves true only if the reward was earned.
 * Never throws.
 */
export async function showRewarded() {
  if (!initialized) await initAds();
  if (!initialized) return false;
  if (!rewardedReady) await prepareRewarded();
  if (!rewardedReady) return false;
  try {
    rewardedReady = false;
    const reward = await AdMob.showRewardVideoAd();
    prepareRewarded();
    return !!reward;
  } catch {
    prepareRewarded();
    return false;
  }
}

/** Opens the UMP privacy options form (GDPR "manage choices"). */
export async function showPrivacyOptions() {
  if (!(await initAds())) return false;
  try {
    await AdMob.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}
