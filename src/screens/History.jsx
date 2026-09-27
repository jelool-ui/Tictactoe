import { useApp } from '../state/AppContext.jsx';
import { Screen } from '../components/ui.jsx';
import { formatDateTime } from '../i18n/i18n.js';
import { formatDuration } from '../utils/time.js';

// French and Spanish write the level in lower case ("Solo — IA difficile").
const lowerLevel = (label, lang) => (lang === 'fr' || lang === 'es' ? label.toLocaleLowerCase(lang) : label);

const OUTCOME_ICON = { win: '🏆', loss: '😔', draw: '🤝' };

export function History({ nav }) {
  const { t, lang, data } = useApp();
  const list = data.history;

  return (
    <Screen title={t('history.title')} onBack={nav.goBack} withBanner>
      {list.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">
            📜
          </div>
          <p>{t('history.empty')}</p>
        </div>
      ) : (
        <ul className="history-list">
          {list.map((h) => {
            const mode =
              h.mode === 'solo'
                ? t('history.solo', { level: lowerLevel(t(`level.${h.difficulty}`), lang) })
                : t('history.duo', { name: h.opponent });
            return (
              <li key={h.id} className={`history-item outcome-${h.outcome}`}>
                <div className="history-main">
                  <div className="history-date">{formatDateTime(h.timestamp, lang)}</div>
                  <div className="history-mode">{mode}</div>
                  <div className="history-meta">
                    {t('history.duration', { time: formatDuration(h.durationMs) })}
                    {h.mode === 'duo' && h.winnerName && ` · ${t('history.winner', { name: h.winnerName })}`}
                  </div>
                </div>
                <div className="history-side">
                  <span className={`badge badge-${h.outcome}`}>
                    {OUTCOME_ICON[h.outcome]} {t(`outcome.${h.outcome}`)}
                  </span>
                  <span className="history-points">+{t('common.pts', { n: h.points })}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
