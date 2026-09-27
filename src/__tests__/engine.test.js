import { describe, expect, it } from 'vitest';
import { emptyBoard, evaluate, play, canPlay, availableMoves } from '../engine/game.js';

const b = (s) => s.split('').map((c) => (c === '.' ? null : c));

describe('game engine', () => {
  it('detects all winning lines', () => {
    expect(evaluate(b('XXX......'))).toMatchObject({ over: true, winner: 'X', line: [0, 1, 2] });
    expect(evaluate(b('O..O..O..'))).toMatchObject({ winner: 'O', line: [0, 3, 6] });
    expect(evaluate(b('X...X...X'))).toMatchObject({ winner: 'X', line: [0, 4, 8] });
    expect(evaluate(b('..O.O.O..'))).toMatchObject({ winner: 'O', line: [2, 4, 6] });
  });
  it('detects a draw', () => {
    expect(evaluate(b('XOXXOOOXX'))).toMatchObject({ over: true, draw: true, winner: null });
  });
  it('game in progress', () => {
    expect(evaluate(emptyBoard())).toMatchObject({ over: false });
  });
  it('refuses occupied cells and moves after the end', () => {
    const board = play(emptyBoard(), 4, 'X');
    expect(canPlay(board, 4)).toBe(false);
    expect(() => play(board, 4, 'O')).toThrow();
    expect(canPlay(b('XXX.OO...'), 3)).toBe(false);
    expect(availableMoves(board)).toHaveLength(8);
  });
});
