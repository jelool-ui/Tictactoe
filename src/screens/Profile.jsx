import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button, Card, Screen, Segmented, StatRow } from '../components/ui.jsx';
import { Mark } from '../components/Mark.jsx';
import { AVATARS, MAX_NAME_LENGTH, sanitizeName } from '../profile/profile.js';
import { mostPlayedLevel } from '../stats/stats.js';
import { formatNumber } from '../i18n/i18n.js';
import { playSound } from '../audio/audio.js';

export function Profile({ nav }) {
  const { t, lang, data, updateProfile, toast } = useApp();
  const { profile, stats } = data;
  const [name, setName] = useState(profile.name);
  const level = mostPlayedLevel(stats);
  const n = (v) => formatNumber(v, lang);

  const saveName = () => {
    const clean = sanitizeName(name);
    setName(clean);
    if (clean !== profile.name) {
      updateProfile({ name: clean });
      toast(t('profile.saved'), '✅');
    }
  };

  return (
    <Screen title={t('profile.title')} onBack={nav.goBack} withBanner>
      <div className="profile-hero">
        <span className="avatar avatar-xl" aria-hidden="true">
          {profile.avatar}
        </span>
        <div className="profile-hero-name">{profile.name || t('profile.defaultName')}</div>
        <div className="profile-hero-score">⭐ {t('common.pts', { n: n(stats.score) })}</div>
      </div>

      <Card>
        <label className="field">
          <span className="field-label">{t('profile.name')}</span>
          <div className="field-inline">
            <input
              className="input"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              placeholder={t('profile.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              enterKeyHint="done"
            />
            <Button variant="primary" onClick={saveName}>
              {t('common.save')}
            </Button>
          </div>
        </label>

        <div className="field">
          <span className="field-label">{t('profile.avatar')}</span>
          <div className="avatar-grid" role="radiogroup" aria-label={t('profile.avatar')}>
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={profile.avatar === a}
                className={`avatar-option ${profile.avatar === a ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  updateProfile({ avatar: a });
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">{t('profile.symbol')}</span>
          <Segmented
            value={profile.symbol}
            onChange={(s) => updateProfile({ symbol: s })}
            ariaLabel={t('profile.symbol')}
            options={['X', 'O'].map((s) => ({ value: s, label: <Mark symbol={s} className="mini" />, className: 'seg-mark' }))}
          />
        </div>
      </Card>

      <Card title={t('profile.stats')}>
        <StatRow label={t('profile.name')} value={profile.name || t('profile.defaultName')} />
        <StatRow label={t('stats.gamesPlayed')} value={n(stats.gamesPlayed)} />
        <StatRow label={t('stats.wins')} value={n(stats.wins)} />
        <StatRow label={t('stats.losses')} value={n(stats.losses)} />
        <StatRow label={t('stats.draws')} value={n(stats.draws)} />
        <StatRow label={t('stats.score')} value={n(stats.score)} />
        <StatRow label={t('stats.currentStreak')} value={n(stats.currentStreak)} />
        <StatRow label={t('stats.bestStreak')} value={n(stats.bestStreak)} />
        <StatRow label={t('stats.winsVsAI')} value={n(stats.winsVsAI)} />
        <StatRow label={t('stats.winsDuo')} value={n(stats.winsDuo)} />
        <StatRow label={t('stats.mostPlayedLevel')} value={level ? t(`level.${level}`) : t('common.none')} />
      </Card>
    </Screen>
  );
}
