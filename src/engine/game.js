/**
 * Game engine — pure functions, no UI or side effects.
 * A board is an array of 9 cells: 'X' | 'O' | null.
 */

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export const emptyBoard = () => Array(9).fill(null);

export const otherSymbol = (symbol) => (symbol === 'X' ? 'O' : 'X');

export const availableMoves = (board) =>
  board.reduce((moves, cell, i) => (cell === null ? [...moves, i] : moves), []);

/** Returns { winner, line } if someone has three in a row, otherwise null. */
export function findWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export const isFull = (board) => board.every((cell) => cell !== null);

/**
 * Evaluates a board.
 * @returns {{ over: boolean, winner: 'X'|'O'|null, line: number[]|null, draw: boolean }}
 */
export function evaluate(board) {
  const win = findWinner(board);
  if (win) return { over: true, winner: win.winner, line: win.line, draw: false };
  if (isFull(board)) return { over: true, winner: null, line: null, draw: true };
  return { over: false, winner: null, line: null, draw: false };
}

/** Returns true if `index` can be played on `board`. */
export const canPlay = (board, index) =>
  Number.isInteger(index) && index >= 0 && index < 9 && board[index] === null && !evaluate(board).over;

/** Returns a new board with `symbol` placed at `index`. Throws on illegal moves. */
export function play(board, index, symbol) {
  if (!canPlay(board, index)) throw new Error(`Illegal move at ${index}`);
  const next = board.slice();
  next[index] = symbol;
  return next;
}
