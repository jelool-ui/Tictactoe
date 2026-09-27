import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button } from '../components/ui.jsx';
import { Confetti } from '../components/Confetti.jsx';
import { formatDuration } from '../utils/time.js';
import { adsSupported, showRewarded } from '../ads/adService.js';
import { isUnlocked } from '../cosmetics/cosmetics.js';

export function ResultOverlay({
  config,
  outcome,
  showTimer,
  canSecondChance,
  onSecondChance,
  onReplay,
  onNewGame,
  onHome,
  onStats,
}) {
  const { t, data, toast } = useApp();
  const [loadingAd, setLoadingAd] = useState(false);
  const { result, record, durationMs, winnerName } = outcome;

  const duo = config.mode === 'duo';
  const someoneWon = result !== 'draw';
  // In 2-player mode both winners get the victory screen.
  const celebrate = result === 'win' || (duo && someoneWon);

  let icon;
  let title;
  let line1;
  let line2 = null;
  if (result === 'draw') {
    icon = '🤝';
    title = t('result.draw');
    line1 = t('result.nobody');
  } else if (celebrate) {
    icon = '🏆';
    title = t('result.win');
    line1 = winnerName;
    line2 = t('result.wonGame');
  } else {
    icon = '😔';
    title = t('result.loss');
    line1 = t('result.aiWon');
  }
  // Points are those of the device owner (solo player / player 1).
  const showPoints = !duo || result !== 'loss';
  const golden = data.cosmetics.winEffect === 'goldenBurst' && isUnlocked(data.cosmetics, 'goldenBurst');

  const secondChance = async () => {
    setLoadingAd(true);
    const ok = await showRewarded();
    setLoadingAd(false);
    if (ok) onSecondChance();
    else toast(t('ads.unavailable'), 'ℹ️');
  };

  return (
    <div className={`result-backdrop result-${celebrate ? 'win' : result}`} role="dialog" aria-modal="true" aria-labelledby="result-title">
      {celebrate && <Confetti golden={golden} />}
      <div className="result-card">
        <div className="result-icon" aria-hidden="true">
          {icon}
        </div>
        <h2 id="result-title" className="result-title">
          {title}
        </h2>
        <p className="result-line1">{line1}</p>
        {line2 && <p className="result-line2">{line2}</p>}
        {showPoints && <p className="result-points">{t.plural('result.points', record.points)}</p>}
        {showTimer && <p className="result-time">⏱ {formatDuration(durationMs)}</p>}

        <div className="result-actions">
          <Button variant="primary" size="lg" icon="↻" onClick={onReplay}>
            {t('result.replay')}
          </Button>
          <Button icon="✚" onClick={onNewGame}>
            {t('result.newGame')}
          </Button>
          <Button icon="⌂" onClick={onHome}>
            {t('result.home')}
          </Button>
          <Button icon="📊" onClick={onStats}>
            {t('result.viewStats')}
          </Button>
          {canSecondChance && adsSupported() && (
            <Button variant="ghost" icon="🎬" onClick={secondChance} disabled={loadingAd}>
              {t('result.secondChance')}
              <small className="btn-sub">
                {t('result.secondChanceHint')} · {t('ads.optional')}
              </small>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
