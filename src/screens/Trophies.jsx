import { useApp } from '../state/AppContext.jsx';
import { Screen } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../achievements/achievements.js';
import { formatDate } from '../i18n/i18n.js';

export function Trophies({ nav }) {
  const { t, lang, data } = useApp();
  const unlocked = data.achievements;
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <Screen title={t('trophies.title')} onBack={nav.goBack} withBanner>
      <div className="trophy-progress">
        <div className="trophy-progress-text">{t('trophies.progress', { n: count, total: ACHIEVEMENTS.length })}</div>
        <div className="bar-track">
          <span className="bar-fill" style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} />
        </div>
      </div>
      <ul className="trophy-list">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          return (
            <li key={a.id} className={`trophy ${at ? 'unlocked' : 'locked'}`}>
              <span className="trophy-icon" aria-hidden="true">
                {at ? a.icon : '🔒'}
              </span>
              <span className="trophy-text">
                <strong>{t(`ach.${a.id}.title`)}</strong>
                <small>{t(`ach.${a.id}.desc`)}</small>
                <small className="trophy-state">
                  {at ? t('trophies.unlockedOn', { date: formatDate(at, lang) }) : t('trophies.locked')}
                </small>
              </span>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
