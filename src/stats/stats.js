/** Player statistics — pure reducers over game results. */

export const defaultStats = () => ({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  score: 0,
  currentStreak: 0,
  bestStreak: 0,
  unbeatenWins: 0, // wins since the last loss (draws do not reset it)
  winsVsAI: 0,
  winsDuo: 0,
  winsByLevel: { beginner: 0, intermediate: 0, hard: 0 },
  aiLevelGames: { beginner: 0, intermediate: 0, hard: 0 },
  totalDurationMs: 0,
  fastestWinMs: null,
  bestScore: 0,
});

/**
 * Applies a finished game to the statistics.
 * @param {ReturnType<typeof defaultStats>} stats
 * @param {{ mode: 'solo'|'duo', difficulty?: string, outcome: 'win'|'loss'|'draw', durationMs: number, points: number }} r
 */
export function applyResult(stats, r) {
  const s = {
    ...stats,
    winsByLevel: { ...stats.winsByLevel },
    aiLevelGames: { ...stats.aiLevelGames },
  };
  s.gamesPlayed += 1;
  s.score += Math.max(0, r.points || 0);
  s.bestScore = Math.max(s.bestScore, s.score);
  s.totalDurationMs += Math.max(0, r.durationMs || 0);

  if (r.mode === 'solo' && r.difficulty in s.aiLevelGames) s.aiLevelGames[r.difficulty] += 1;

  if (r.outcome === 'win') {
    s.wins += 1;
    s.currentStreak += 1;
    s.unbeatenWins += 1;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    if (r.mode === 'solo') {
      s.winsVsAI += 1;
      if (r.difficulty in s.winsByLevel) s.winsByLevel[r.difficulty] += 1;
    } else {
      s.winsDuo += 1;
    }
    if (r.durationMs > 0 && (s.fastestWinMs === null || r.durationMs < s.fastestWinMs)) {
      s.fastestWinMs = r.durationMs;
    }
  } else if (r.outcome === 'loss') {
    s.losses += 1;
    s.currentStreak = 0;
    s.unbeatenWins = 0;
  } else {
    s.draws += 1;
    s.currentStreak = 0; // a draw breaks a "consecutive wins" streak
  }
  return s;
}

export const averageDurationMs = (s) => (s.gamesPlayed ? Math.round(s.totalDurationMs / s.gamesPlayed) : 0);

export const winRate = (s) => (s.gamesPlayed ? Math.round((s.wins / s.gamesPlayed) * 100) : 0);

/** Most played AI level, or null if the player never played solo. */
export function mostPlayedLevel(s) {
  let best = null;
  for (const [level, count] of Object.entries(s.aiLevelGames)) {
    if (count > 0 && (best === null || count > s.aiLevelGames[best])) best = level;
  }
  return best;
}
