import { describe, expect, it } from 'vitest';
import { applyResult, defaultStats, mostPlayedLevel, averageDurationMs } from '../stats/stats.js';
import { pointsFor } from '../stats/scoring.js';
import { newlyUnlocked } from '../achievements/achievements.js';
import { addEntry, HISTORY_LIMIT } from '../history/history.js';
import { shouldShowInterstitial } from '../ads/adPolicy.js';
import { hydrate } from '../state/model.js';
import { grantReward, isUnlocked, REWARD_DURATION_MS } from '../cosmetics/cosmetics.js';

const res = (outcome, extra = {}) => {
  const r = { mode: 'solo', difficulty: 'hard', outcome, durationMs: 30000, ...extra };
  return { ...r, points: pointsFor(r) };
};

describe('scoring', () => {
  it('matches the rules', () => {
    expect(pointsFor({ mode: 'solo', difficulty: 'beginner', outcome: 'win' })).toBe(10);
    expect(pointsFor({ mode: 'solo', difficulty: 'intermediate', outcome: 'win' })).toBe(20);
    expect(pointsFor({ mode: 'solo', difficulty: 'hard', outcome: 'win' })).toBe(30);
    expect(pointsFor({ mode: 'duo', outcome: 'win' })).toBe(20);
    expect(pointsFor({ mode: 'duo', outcome: 'draw' })).toBe(5);
    expect(pointsFor({ mode: 'solo', difficulty: 'hard', outcome: 'draw' })).toBe(5);
    expect(pointsFor({ mode: 'solo', difficulty: 'hard', outcome: 'loss' })).toBe(0);
  });
});

describe('stats', () => {
  it('tracks wins, streaks, levels and never removes points', () => {
    let s = defaultStats();
    s = applyResult(s, res('win'));
    s = applyResult(s, res('win', { mode: 'duo', difficulty: undefined, durationMs: 9000 }));
    s = applyResult(s, res('loss'));
    s = applyResult(s, res('draw', { difficulty: 'beginner' }));
    expect(s).toMatchObject({
      gamesPlayed: 4, wins: 2, losses: 1, draws: 1, score: 55,
      bestStreak: 2, currentStreak: 0, winsVsAI: 1, winsDuo: 1, fastestWinMs: 9000,
    });
    expect(s.aiLevelGames).toEqual({ beginner: 1, intermediate: 0, hard: 2 });
    expect(mostPlayedLevel(s)).toBe('hard');
    expect(averageDurationMs(s)).toBe(Math.round((30000 * 3 + 9000) / 4));
  });
});

describe('achievements', () => {
  it('unlocks the expected trophies', () => {
    let s = defaultStats();
    for (let i = 0; i < 5; i++) s = applyResult(s, res('win', { durationMs: 12000 }));
    expect(newlyUnlocked(s, {}).sort()).toEqual(
      ['antiAI', 'fast', 'firstWin', 'master100', 'strategist', 'streak3', 'streak5'].sort(),
    );
    expect(newlyUnlocked(s, { firstWin: 1 })).not.toContain('firstWin');
  });
  it('strategist allows draws but not losses', () => {
    let s = defaultStats();
    for (let i = 0; i < 4; i++) s = applyResult(s, res('win'));
    s = applyResult(s, res('draw'));
    s = applyResult(s, res('win'));
    expect(newlyUnlocked(s, {})).toContain('strategist');
    s = applyResult(s, res('loss'));
    expect(s.unbeatenWins).toBe(0);
  });
});

describe('history', () => {
  it('keeps newest first and is capped', () => {
    let h = [];
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) h = addEntry(h, { timestamp: i, outcome: 'win', points: 10 });
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(h[0].timestamp).toBe(HISTORY_LIMIT + 9);
  });
});

describe('ads pacing', () => {
  const cfg = { everyNGames: 4, minIntervalMs: 240000, graceGames: 3 };
  it('respects grace period, frequency and interval', () => {
    expect(shouldShowInterstitial({ gamesSinceInterstitial: 4, lastInterstitialAt: 0 }, 2, 1e9, cfg)).toBe(false);
    expect(shouldShowInterstitial({ gamesSinceInterstitial: 3, lastInterstitialAt: 0 }, 10, 1e9, cfg)).toBe(false);
    expect(shouldShowInterstitial({ gamesSinceInterstitial: 4, lastInterstitialAt: 1e9 - 1000 }, 10, 1e9, cfg)).toBe(false);
    expect(shouldShowInterstitial({ gamesSinceInterstitial: 4, lastInterstitialAt: 0 }, 10, 1e9, cfg)).toBe(true);
  });
});

describe('persistence model', () => {
  it('hydrates partial / old data with defaults', () => {
    const d = hydrate({ settings: { language: 'xx', sound: false }, stats: { wins: 3 } }, 'fr');
    expect(d.settings.language).toBe('fr');
    expect(d.settings.sound).toBe(false);
    expect(d.stats.wins).toBe(3);
    expect(d.stats.winsByLevel).toEqual({ beginner: 0, intermediate: 0, hard: 0 });
    expect(hydrate(null, 'de').settings.language).toBe('de');
  });
});

describe('cosmetics', () => {
  it('reward unlocks expire', () => {
    const c = grantReward({ unlocks: {} }, 'aurora', 1000);
    expect(isUnlocked(c, 'aurora', 2000)).toBe(true);
    expect(isUnlocked(c, 'aurora', 1000 + REWARD_DURATION_MS + 1)).toBe(false);
    expect(isUnlocked(c, 'classic')).toBe(true);
  });
});
