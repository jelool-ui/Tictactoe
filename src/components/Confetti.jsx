import { useMemo } from 'react';

/** Lightweight CSS confetti (no canvas, no library). */
export function Confetti({ golden = false, count = 28 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.4 + Math.random() * 1.1,
        rot: Math.random() * 360,
        hue: golden ? 40 + Math.random() * 15 : (i * 47) % 360,
        size: 6 + Math.random() * 6,
      })),
    [count, golden],
  );
  return (
    <div className={`confetti ${golden ? 'golden' : ''}`} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            width: p.size,
            height: p.size * 1.6,
            background: `hsl(${p.hue} 90% ${golden ? 55 : 60}%)`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
