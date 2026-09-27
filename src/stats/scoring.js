/** Scoring rules. Points are never removed. */
export const POINTS = {
  soloWin: { beginner: 10, intermediate: 20, hard: 30 },
  duoWin: 20,
  draw: 5,
  loss: 0,
};

/**
 * @param {{ mode: 'solo'|'duo', difficulty?: string, outcome: 'win'|'loss'|'draw' }} result
 */
export function pointsFor({ mode, difficulty, outcome }) {
  if (outcome === 'draw') return POINTS.draw;
  if (outcome !== 'win') return POINTS.loss;
  if (mode === 'duo') return POINTS.duoWin;
  return POINTS.soloWin[difficulty] ?? 0;
}
