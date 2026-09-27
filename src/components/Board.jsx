import { Mark } from './Mark.jsx';
import { useApp } from '../state/AppContext.jsx';

const center = (i) => ({ x: (i % 3) * 100 + 50, y: Math.floor(i / 3) * 100 + 50 });

/** 3×3 board. The grid is always laid out left-to-right (also in RTL languages). */
export function Board({ board, winLine, onPlay, disabled, lastMove }) {
  const { t } = useApp();
  let line = null;
  if (winLine) {
    const a = center(winLine[0]);
    const c = center(winLine[2]);
    // extend the line slightly beyond the cell centres
    const dx = (c.x - a.x) * 0.16;
    const dy = (c.y - a.y) * 0.16;
    line = { x1: a.x - dx, y1: a.y - dy, x2: c.x + dx, y2: c.y + dy };
  }
  return (
    <div className={`board ${winLine ? 'has-win' : ''}`} dir="ltr" role="grid">
      {board.map((cell, i) => {
        const isWin = winLine?.includes(i);
        const playable = !disabled && cell === null;
        return (
          <button
            key={i}
            type="button"
            className={`cell ${cell ? `filled cell-${cell.toLowerCase()}` : ''} ${isWin ? 'win' : ''} ${
              lastMove === i ? 'last' : ''
            }`}
            onClick={() => playable && onPlay(i)}
            aria-disabled={!playable}
            aria-label={`${t('game.cellLabel', { n: i + 1 })}: ${cell ?? t('game.cellEmpty')}`}
          >
            <Mark symbol={cell} />
          </button>
        );
      })}
      {line && (
        <svg className="win-line" viewBox="0 0 300 300" aria-hidden="true">
          <line {...line} pathLength="1" />
        </svg>
      )}
    </div>
  );
}
