import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button, Screen, Segmented, Card } from '../components/ui.jsx';
import { Mark } from '../components/Mark.jsx';
import { MAX_NAME_LENGTH, sanitizeName } from '../profile/profile.js';
import { otherSymbol } from '../engine/game.js';

export function DuoSetup({ nav }) {
  const { t, data, updateMeta } = useApp();
  const last = data.meta.lastDuo;
  const [p1, setP1] = useState(data.profile.name || last?.p1 || '');
  const [p2, setP2] = useState(last?.p2 || '');
  const [starter, setStarter] = useState(last?.starter ?? 0);
  const [p1Symbol, setP1Symbol] = useState(last?.p1Symbol || data.profile.symbol);

  const n1 = sanitizeName(p1) || t('duo.player1');
  const n2 = sanitizeName(p2) || t('duo.player2');

  const start = () => {
    updateMeta({ lastDuo: { p1: sanitizeName(p1), p2: sanitizeName(p2), starter, p1Symbol } });
    nav.navigate('game', {
      config: {
        mode: 'duo',
        players: [
          { name: n1, symbol: p1Symbol },
          { name: n2, symbol: otherSymbol(p1Symbol) },
        ],
        starter,
      },
    });
  };

  return (
    <Screen title={t('duo.title')} onBack={nav.goBack}>
      <Card>
        <label className="field">
          <span className="field-label">
            <Mark symbol={p1Symbol} className="mini" /> {t('duo.player1')}
          </span>
          <input
            className="input"
            value={p1}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('duo.namePlaceholder')}
            onChange={(e) => setP1(e.target.value)}
            enterKeyHint="next"
          />
        </label>
        <label className="field">
          <span className="field-label">
            <Mark symbol={otherSymbol(p1Symbol)} className="mini" /> {t('duo.player2')}
          </span>
          <input
            className="input"
            value={p2}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('duo.namePlaceholder')}
            onChange={(e) => setP2(e.target.value)}
            enterKeyHint="done"
          />
        </label>
        <p className="hint">{t('duo.hint')}</p>
      </Card>
      <Card title={t('duo.whoStarts')}>
        <Segmented
          value={starter}
          onChange={setStarter}
          ariaLabel={t('duo.whoStarts')}
          options={[
            { value: 0, label: n1 },
            { value: 1, label: n2 },
          ]}
        />
      </Card>
      <Card title={t('duo.p1Symbol')}>
        <Segmented
          value={p1Symbol}
          onChange={setP1Symbol}
          ariaLabel={t('duo.p1Symbol')}
          options={['X', 'O'].map((s) => ({ value: s, label: <Mark symbol={s} className="mini" />, className: 'seg-mark' }))}
        />
      </Card>
      <Button variant="primary" size="xl" icon="▶" onClick={start}>
        {t('common.start')}
      </Button>
    </Screen>
  );
}
