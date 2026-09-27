import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button, Screen, Segmented, Card } from '../components/ui.jsx';
import { DIFFICULTIES } from '../ai/ai.js';
import { Mark } from '../components/Mark.jsx';
import { playSound } from '../audio/audio.js';

const LEVEL_ICONS = { beginner: '🙂', intermediate: '😼', hard: '🤖' };

export function SoloSetup({ nav }) {
  const { t, data, updateMeta } = useApp();
  const [difficulty, setDifficulty] = useState(data.meta.lastDifficulty || 'intermediate');
  const [starter, setStarter] = useState('human');
  const [symbol, setSymbol] = useState(data.profile.symbol);

  const start = () => {
    updateMeta({ lastDifficulty: difficulty });
    nav.navigate('game', { config: { mode: 'solo', difficulty, humanSymbol: symbol, starter } });
  };

  return (
    <Screen title={t('solo.title')} onBack={nav.goBack}>
      <Card title={t('solo.level')}>
        <div className="level-list" role="radiogroup" aria-label={t('solo.level')}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={difficulty === d}
              className={`level-card ${difficulty === d ? 'active' : ''}`}
              onClick={() => {
                playSound('click');
                setDifficulty(d);
              }}
            >
              <span className="level-icon" aria-hidden="true">
                {LEVEL_ICONS[d]}
              </span>
              <span className="level-text">
                <strong>{t(`level.${d}`)}</strong>
                <small>{t(`level.${d}.desc`)}</small>
              </span>
            </button>
          ))}
        </div>
      </Card>
      <Card title={t('solo.whoStarts')}>
        <Segmented
          value={starter}
          onChange={setStarter}
          ariaLabel={t('solo.whoStarts')}
          options={[
            { value: 'human', label: `👤 ${t('solo.meFirst')}` },
            { value: 'ai', label: `🤖 ${t('solo.aiFirst')}` },
          ]}
        />
      </Card>
      <Card title={t('solo.yourSymbol')}>
        <Segmented
          value={symbol}
          onChange={setSymbol}
          ariaLabel={t('solo.yourSymbol')}
          options={['X', 'O'].map((s) => ({ value: s, label: <Mark symbol={s} className="mini" />, className: 'seg-mark' }))}
        />
      </Card>
      <Button variant="primary" size="xl" icon="▶" onClick={start}>
        {t('common.start')}
      </Button>
    </Screen>
  );
}
