import { useApp } from '../state/AppContext.jsx';
import { Card, Screen, StatRow, StatTile } from '../components/ui.jsx';
import { averageDurationMs, mostPlayedLevel, winRate } from '../stats/stats.js';
import { formatNumber } from '../i18n/i18n.js';
import { formatDuration } from '../utils/time.js';
import { DIFFICULTIES } from '../ai/ai.js';

export function Stats({ nav }) {
  const { t, lang, data } = useApp();
  const s = data.stats;
  const n = (v) => formatNumber(v, lang);
  const level = mostPlayedLevel(s);
  const maxLevelWins = Math.max(1, ...Object.values(s.winsByLevel));

  return (
    <Screen title={t('stats.title')} onBack={nav.goBack} withBanner>
      <div className="tiles">
        <StatTile icon="⭐" label={t('stats.score')} value={n(s.score)} accent />
        <StatTile icon="🎮" label={t('stats.gamesPlayed')} value={n(s.gamesPlayed)} />
        <StatTile icon="🏆" label={t('stats.wins')} value={n(s.wins)} />
        <StatTile icon="😔" label={t('stats.losses')} value={n(s.losses)} />
        <StatTile icon="🤝" label={t('stats.draws')} value={n(s.draws)} />
        <StatTile icon="📈" label={t('stats.winRate')} value={`${n(winRate(s))} %`} />
      </div>

      <Card title={`🥇 ${t('records.title')}`}>
        <StatRow label={t('records.bestStreak')} value={n(s.bestStreak)} />
        <StatRow label={t('records.bestScore')} value={n(s.bestScore)} />
        <StatRow label={t('records.mostWins')} value={n(s.wins)} />
        <StatRow
          label={t('records.fastestWin')}
          value={s.fastestWinMs !== null ? formatDuration(s.fastestWinMs) : t('common.none')}
        />
        <StatRow label={t('records.gamesPlayed')} value={n(s.gamesPlayed)} />
      </Card>

      <Card title={`🔥 ${t('stats.currentStreak')}`}>
        <StatRow label={t('stats.currentStreak')} value={n(s.currentStreak)} />
        <StatRow label={t('stats.bestStreak')} value={n(s.bestStreak)} />
        <StatRow label={t('stats.winsVsAI')} value={n(s.winsVsAI)} />
        <StatRow label={t('stats.winsDuo')} value={n(s.winsDuo)} />
        <StatRow label={t('stats.mostPlayedLevel')} value={level ? t(`level.${level}`) : t('common.none')} />
      </Card>

      <Card title={`⏱ ${t('stats.time')}`}>
        <StatRow label={t('stats.avgDuration')} value={s.gamesPlayed ? formatDuration(averageDurationMs(s)) : t('common.none')} />
        <StatRow
          label={t('stats.fastestWin')}
          value={s.fastestWinMs !== null ? formatDuration(s.fastestWinMs) : t('common.none')}
        />
        <StatRow label={t('stats.totalTime')} value={formatDuration(s.totalDurationMs)} />
      </Card>

      <Card title={`🤖 ${t('stats.byLevel')}`}>
        {DIFFICULTIES.map((d) => (
          <div className="bar-row" key={d}>
            <span className="bar-label">{t(`level.${d}`)}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(s.winsByLevel[d] / maxLevelWins) * 100}%` }} />
            </span>
            <strong className="bar-value">{n(s.winsByLevel[d])}</strong>
          </div>
        ))}
      </Card>
    </Screen>
  );
}
