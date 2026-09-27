/** Pure interstitial pacing rules (unit-tested). */
import { AD_CONFIG } from './adConfig.js';

/**
 * @param {{ gamesSinceInterstitial:number, lastInterstitialAt:number }} adState
 * @param {number} totalGamesPlayed
 * @param {number} now
 */
export function shouldShowInterstitial(adState, totalGamesPlayed, now, cfg = AD_CONFIG.interstitial) {
  if (totalGamesPlayed <= cfg.graceGames) return false;
  if (adState.gamesSinceInterstitial < cfg.everyNGames) return false;
  return now - (adState.lastInterstitialAt || 0) >= cfg.minIntervalMs;
}
