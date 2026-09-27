/**
 * Offline AI for Tic-Tac-Toe with three difficulty levels.
 *  - beginner:      mostly random, sometimes takes an obvious win.
 *  - intermediate:  wins and blocks most of the time, otherwise mixes good and random moves.
 *  - hard:          perfect play (minimax with alpha-beta) — never loses.
 */
import { WIN_LINES, availableMoves, findWinner, otherSymbol } from '../engine/game.js';

export const DIFFICULTIES = ['beginner', 'intermediate', 'hard'];

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Finds a cell that completes a line of `symbol` (win or block). */
export function findLineCompletion(board, symbol) {
  for (const [a, b, c] of WIN_LINES) {
    const cells = [board[a], board[b], board[c]];
    if (cells.filter((v) => v === symbol).length === 2 && cells.includes(null)) {
      return [a, b, c][cells.indexOf(null)];
    }
  }
  return -1;
}

function minimax(board, current, me, depth, alpha, beta) {
  const win = findWinner(board);
  if (win) return win.winner === me ? 10 - depth : depth - 10;
  const moves = availableMoves(board);
  if (moves.length === 0) return 0;

  const maximizing = current === me;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    board[move] = current;
    const score = minimax(board, otherSymbol(current), me, depth + 1, alpha, beta);
    board[move] = null;
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

// Memoization: tic-tac-toe has only a few thousand positions, so results are cached.
const cache = new Map();

/** Returns all optimal moves for `symbol`. */
export function bestMoves(board, symbol) {
  const key = board.map((c) => c ?? '.').join('') + symbol;
  const hit = cache.get(key);
  if (hit) return hit;
  const work = board.slice();
  let bestScore = -Infinity;
  let result = [];
  for (const move of availableMoves(work)) {
    work[move] = symbol;
    const score = minimax(work, otherSymbol(symbol), symbol, 1, -Infinity, Infinity);
    work[move] = null;
    if (score > bestScore) {
      bestScore = score;
      result = [move];
    } else if (score === bestScore) {
      result.push(move);
    }
  }
  cache.set(key, result);
  return result;
}

/**
 * Chooses the AI move.
 * @param {Array} board current board
 * @param {'X'|'O'} symbol the AI symbol
 * @param {'beginner'|'intermediate'|'hard'} difficulty
 * @param {() => number} rng random generator (injectable for tests)
 * @returns {number} cell index
 */
export function chooseMove(board, symbol, difficulty = 'hard', rng = Math.random) {
  const moves = availableMoves(board);
  if (moves.length === 0) return -1;
  const opponent = otherSymbol(symbol);

  if (difficulty === 'beginner') {
    const win = findLineCompletion(board, symbol);
    if (win !== -1 && rng() < 0.5) return win;
    const block = findLineCompletion(board, opponent);
    if (block !== -1 && rng() < 0.25) return block;
    return pick(moves, rng);
  }

  if (difficulty === 'intermediate') {
    const win = findLineCompletion(board, symbol);
    if (win !== -1) return win;
    const block = findLineCompletion(board, opponent);
    if (block !== -1 && rng() < 0.85) return block;
    if (rng() < 0.55) return pick(bestMoves(board, symbol), rng);
    return pick(moves, rng);
  }

  // hard — perfect play. Opening: vary between optimal moves for less predictability.
  return pick(bestMoves(board, symbol), rng);
}
