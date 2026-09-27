import { useEffect, useState } from 'react';
import { formatDuration } from '../utils/time.js';

/** Game chronometer: starts at the first move, freezes when the game ends. */
export function Timer({ startedAt, endedAt, pausedOffset = 0 }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt || endedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, endedAt]);
  const elapsed = startedAt ? (endedAt ?? now) - startedAt - pausedOffset : 0;
  return (
    <div className={`timer ${endedAt ? 'stopped' : ''}`} role="timer" aria-live="off">
      <span aria-hidden="true">⏱</span> {formatDuration(elapsed)}
    </div>
  );
}
