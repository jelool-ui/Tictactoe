import { describe, expect, it } from 'vitest';
import { chooseMove, DIFFICULTIES } from '../ai/ai.js';
import { emptyBoard, evaluate, availableMoves, otherSymbol } from '../engine/game.js';

/** Explores every possible opponent line against the AI; returns the number of AI losses. */
function exhaustiveLosses(aiSymbol, aiStarts) {
  let losses = 0;
  let games = 0;
  const walk = (board, turn) => {
    const s = evaluate(board);
    if (s.over) {
      games += 1;
      if (s.winner && s.winner !== aiSymbol) losses += 1;
      return;
    }
    if (turn === aiSymbol) {
      const m = chooseMove(board, aiSymbol, 'hard', () => 0);
      const next = board.slice();
      next[m] = aiSymbol;
      walk(next, otherSymbol(turn));
    } else {
      for (const m of availableMoves(board)) {
        const next = board.slice();
        next[m] = turn;
        walk(next, otherSymbol(turn));
      }
    }
  };
  walk(emptyBoard(), aiStarts ? aiSymbol : otherSymbol(aiSymbol));
  return { losses, games };
}

describe('AI', () => {
  it('hard AI never loses (exhaustive, both sides, both symbols)', () => {
    for (const sym of ['X', 'O']) {
      for (const starts of [true, false]) {
        const { losses, games } = exhaustiveLosses(sym, starts);
        expect(games).toBeGreaterThan(0);
        expect(losses).toBe(0);
      }
    }
  });

  it('every level always returns a legal move quickly', () => {
    for (const level of DIFFICULTIES) {
      for (let i = 0; i < 200; i++) {
        const board = emptyBoard();
        let turn = 'X';
        while (!evaluate(board).over) {
          const t0 = performance.now();
          const m = chooseMove(board, turn, level);
          expect(performance.now() - t0).toBeLessThan(50);
          expect(board[m]).toBeNull();
          board[m] = turn;
          turn = otherSymbol(turn);
        }
      }
    }
  });

  it('intermediate always takes an immediate win', () => {
    const b = ['O', 'O', null, 'X', 'X', null, null, null, null];
    for (let i = 0; i < 50; i++) expect(chooseMove(b, 'O', 'intermediate')).toBe(2);
  });

  it('difficulty levels are ordered (beginner loses more to random play than intermediate)', () => {
    const lossRate = (level) => {
      let losses = 0;
      for (let g = 0; g < 600; g++) {
        const board = emptyBoard();
        let turn = g % 2 ? 'X' : 'O';
        while (!evaluate(board).over) {
          const moves = availableMoves(board);
          const m = turn === 'X' ? chooseMove(board, 'X', level) : moves[Math.floor(Math.random() * moves.length)];
          board[m] = turn;
          turn = otherSymbol(turn);
        }
        if (evaluate(board).winner === 'O') losses += 1;
      }
      return losses / 600;
    };
    const beginner = lossRate('beginner');
    const intermediate = lossRate('intermediate');
    const hard = lossRate('hard');
    expect(hard).toBe(0);
    expect(beginner).toBeGreaterThan(intermediate);
  });
});
