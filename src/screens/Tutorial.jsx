import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button } from '../components/ui.jsx';
import { Mark } from '../components/Mark.jsx';

const DEMO = [
  ['X', null, 'O', null, 'X', null, null, 'O', null],
  ['X', 'O', null, null, 'X', null, null, null, null],
  ['X', 'O', 'O', null, 'X', null, null, null, 'X'],
];
const ICONS = ['🎮', '👆', '🏆'];

export function Tutorial({ onDone }) {
  const { t } = useApp();
  const [step, setStep] = useState(0);
  const last = step === 2;

  return (
    <div className="tutorial" role="dialog" aria-modal="true" aria-labelledby="tuto-title">
      <div className="tutorial-card">
        <div className="tutorial-top">
          <span className="tutorial-dots" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === step ? 'on' : ''} />
            ))}
          </span>
          <button type="button" className="link-btn" onClick={onDone}>
            {t('tutorial.skip')}
          </button>
        </div>
        <div className="tutorial-icon" aria-hidden="true">
          {ICONS[step]}
        </div>
        {step > 0 ? (
          <div className={`mini-board ${step === 2 ? 'demo-win' : ''}`} dir="ltr" aria-hidden="true">
            {DEMO[step].map((c, i) => (
              <span key={i} className={step === 2 && [0, 4, 8].includes(i) ? 'win' : ''}>
                <Mark symbol={c} />
              </span>
            ))}
          </div>
        ) : (
          <div className="tutorial-modes" aria-hidden="true">
            <span>🤖</span>
            <span>👥</span>
          </div>
        )}
        <h2 id="tuto-title" className="tutorial-title">
          {step + 1}. {t(`tutorial.step${step + 1}.title`)}
        </h2>
        <p className="tutorial-text">{t(`tutorial.step${step + 1}.text`)}</p>
        <Button variant="primary" size="lg" onClick={() => (last ? onDone() : setStep(step + 1))}>
          {last ? t('tutorial.start') : t('tutorial.next')}
        </Button>
      </div>
    </div>
  );
}
