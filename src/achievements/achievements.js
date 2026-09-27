/**
 * Achievements (trophies). Each definition has a pure `check(stats, lastResult)` predicate.
 * Add a new trophy by appending to ACHIEVEMENTS and adding its i18n keys
 * (`ach.<id>.title` / `ach.<id>.desc`).
 */

export const FAST_WIN_MS = 15000;
export const STRATEGIST_WINS = 5;

export const ACHIEVEMENTS = [
  { id: 'firstWin', icon: '🏆', check: (s) => s.wins >= 1 },
  { id: 'streak3', icon: '🔥', check: (s) => s.bestStreak >= 3 },
  { id: 'streak5', icon: '🔥', check: (s) => s.bestStreak >= 5 },
  { id: 'master100', icon: '💎', check: (s) => s.score >= 100 },
  { id: 'antiAI', icon: '🤖', check: (s) => s.winsByLevel.hard >= 1 },
  { id: 'fast', icon: '⚡', check: (s) => s.fastestWinMs !== null && s.fastestWinMs <= FAST_WIN_MS },
  { id: 'strategist', icon: '🎯', check: (s) => s.unbeatenWins >= STRATEGIST_WINS },
  { id: 'wins50', icon: '🏅', check: (s) => s.wins >= 50 },
  { id: 'wins100', icon: '🏆', check: (s) => s.wins >= 100 },
];

/**
 * Returns the ids of achievements newly unlocked by `stats`.
 * @param {object} stats
 * @param {Record<string, number>} unlocked map id -> unlock timestamp
 */
export function newlyUnlocked(stats, unlocked) {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(stats)).map((a) => a.id);
}
