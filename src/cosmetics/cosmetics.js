/**
 * Cosmetic catalog — prepared for future optional packs (themes, X/O styles,
 * victory effects, board animations, sound packs). Cosmetics NEVER affect gameplay.
 *
 * Unlock types:
 *  - 'free'     : always available
 *  - 'reward'   : temporarily unlocked by a voluntary rewarded ad (REWARD_DURATION_MS)
 *  - 'purchase' : reserved for a future optional store (not active at launch)
 */
import { THEMES } from '../themes/themes.js';

export const REWARD_DURATION_MS = 24 * 60 * 60 * 1000;

export const COSMETIC_TYPES = ['theme', 'markStyle', 'winEffect', 'boardAnimation', 'soundPack'];

export const CATALOG = [
  ...THEMES.map((t) => ({ id: t.id, type: 'theme', unlock: t.unlock })),
  { id: 'standard', type: 'markStyle', unlock: 'free' },
  { id: 'confetti', type: 'winEffect', unlock: 'free' },
  { id: 'goldenBurst', type: 'winEffect', unlock: 'reward' },
  { id: 'pop', type: 'boardAnimation', unlock: 'free' },
  { id: 'synth', type: 'soundPack', unlock: 'free' },
];

export const defaultCosmetics = () => ({
  // id -> expiry timestamp for reward unlocks, or Infinity-like (null) for permanent ones.
  unlocks: {},
  winEffect: 'confetti',
  markStyle: 'standard',
});

export function isUnlocked(cosmetics, id, now = Date.now()) {
  const item = CATALOG.find((c) => c.id === id);
  if (!item) return false;
  if (item.unlock === 'free') return true;
  const exp = cosmetics.unlocks[id];
  if (exp === null) return true; // permanent (future purchase)
  return typeof exp === 'number' && exp > now;
}

export function grantReward(cosmetics, id, now = Date.now()) {
  return { ...cosmetics, unlocks: { ...cosmetics.unlocks, [id]: now + REWARD_DURATION_MS } };
}

export const remainingMs = (cosmetics, id, now = Date.now()) => {
  const exp = cosmetics.unlocks[id];
  return typeof exp === 'number' ? Math.max(0, exp - now) : 0;
};
