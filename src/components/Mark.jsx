/** SVG X / O marks — crisp at any size, animated with CSS stroke drawing. */
export function Mark({ symbol, className = '' }) {
  if (symbol === 'X') {
    return (
      <svg viewBox="0 0 100 100" className={`mark mark-x ${className}`} aria-hidden="true">
        <path d="M24 24 L76 76" pathLength="1" />
        <path d="M76 24 L24 76" pathLength="1" className="second" />
      </svg>
    );
  }
  if (symbol === 'O') {
    return (
      <svg viewBox="0 0 100 100" className={`mark mark-o ${className}`} aria-hidden="true">
        <circle cx="50" cy="50" r="27" pathLength="1" />
      </svg>
    );
  }
  return null;
}
