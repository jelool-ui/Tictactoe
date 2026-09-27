import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button, Card, ConfirmDialog, Screen, Toggle } from '../components/ui.jsx';
import { LANGUAGES } from '../i18n/languages.js';
import { THEMES } from '../themes/themes.js';
import { grantReward, isUnlocked, remainingMs } from '../cosmetics/cosmetics.js';
import { adsSupported, showPrivacyOptions, showRewarded } from '../ads/adService.js';
import { playSound } from '../audio/audio.js';
import { formatRemaining } from '../utils/time.js';

/* global __APP_VERSION__ */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export function Settings({ nav }) {
  const app = useApp();
  const { t, data, updateSettings, updateCosmetics, updateMeta, clearHistory, resetStats, resetData, toast } = app;
  const { settings, cosmetics } = data;
  const [confirm, setConfirm] = useState(null); // 'history' | 'stats' | 'data'
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  // refresh "time left" labels for reward unlocks
  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const unlockWithAd = async (id, after) => {
    setBusy(true);
    const ok = await showRewarded();
    setBusy(false);
    if (!ok) {
      toast(t('ads.unavailable'), 'ℹ️');
      return;
    }
    updateCosmetics((c) => grantReward(c, id));
    after?.();
    playSound('trophy');
    toast(t('ads.rewardThanks'), '🎁');
  };

  const selectTheme = (theme) => {
    playSound('click');
    if (isUnlocked(cosmetics, theme.id)) updateSettings({ theme: theme.id });
    else if (theme.unlock === 'reward' && !busy) unlockWithAd(theme.id, () => updateSettings({ theme: theme.id }));
  };

  const goldenUnlocked = isUnlocked(cosmetics, 'goldenBurst');

  const confirmations = {
    history: {
      title: t('confirm.clearHistory.title'),
      text: t('confirm.clearHistory.text'),
      run: () => {
        clearHistory();
        toast(t('toast.historyCleared'), '🗑️');
      },
    },
    stats: {
      title: t('confirm.resetStats.title'),
      text: t('confirm.resetStats.text'),
      run: () => {
        resetStats();
        toast(t('toast.statsReset'), '🗑️');
      },
    },
    data: {
      title: t('confirm.resetData.title'),
      text: t('confirm.resetData.text'),
      run: () => {
        resetData();
        toast(t('toast.dataReset'), '🗑️');
        nav.goHome();
      },
    },
  };
  const c = confirm && confirmations[confirm];

  return (
    <Screen title={t('settings.title')} onBack={nav.goBack}>
      <Card title={`🌐 ${t('settings.language')}`}>
        <div className="lang-list" role="radiogroup" aria-label={t('settings.language')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={settings.language === l.code}
              lang={l.code}
              dir={l.dir}
              className={`lang-option ${settings.language === l.code ? 'active' : ''}`}
              onClick={() => {
                playSound('click');
                updateSettings({ language: l.code });
              }}
            >
              <span aria-hidden="true">{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title={t('settings.audio')}>
        <Toggle icon="🔊" label={t('settings.sound')} checked={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Toggle icon="🎵" label={t('settings.music')} checked={settings.music} onChange={(v) => updateSettings({ music: v })} />
        <label className="row row-slider">
          <span className="row-label">
            <span className="row-icon" aria-hidden="true">
              🎚️
            </span>
            {t('settings.volume')}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(settings.volume * 100)}
            disabled={!settings.sound}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) / 100 })}
            onPointerUp={() => playSound('x')}
            aria-valuetext={`${Math.round(settings.volume * 100)} %`}
          />
          <span className="slider-value">{Math.round(settings.volume * 100)}%</span>
        </label>
        <Toggle
          icon="📳"
          label={t('settings.vibration')}
          checked={settings.vibration}
          onChange={(v) => updateSettings({ vibration: v })}
        />
      </Card>

      <Card title={t('settings.game')}>
        <Toggle icon="⏱" label={t('settings.timer')} checked={settings.timer} onChange={(v) => updateSettings({ timer: v })} />
        <div className="field">
          <span className="field-label">🎨 {t('settings.theme')}</span>
          <div className="theme-grid" role="radiogroup" aria-label={t('settings.theme')}>
            {THEMES.map((th) => {
              const unlocked = isUnlocked(cosmetics, th.id);
              const active = app.effectiveTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`theme-option ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
                  onClick={() => selectTheme(th)}
                  disabled={busy}
                >
                  <span className="theme-swatch" style={{ background: th.vars['--bg'] }}>
                    <span style={{ color: th.vars['--x'] }}>X</span>
                    <span style={{ color: th.vars['--o'] }}>O</span>
                  </span>
                  <span className="theme-name">{t(`theme.${th.id}`)}</span>
                  {th.unlock === 'reward' && (
                    <small className="theme-sub">
                      {unlocked
                        ? t('theme.rewardActive', { time: formatRemaining(remainingMs(cosmetics, th.id)) })
                        : `🎬 ${t('theme.rewardLocked')}`}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="row">
          <span className="row-label">
            <span className="row-icon" aria-hidden="true">
              ✨
            </span>
            <span>
              {t('cosmetic.goldenBurst')}
              <small className="row-sub">
                {goldenUnlocked
                  ? t('theme.rewardActive', { time: formatRemaining(remainingMs(cosmetics, 'goldenBurst')) })
                  : `${t('theme.rewardLocked')} · ${t('ads.optional')}`}
              </small>
            </span>
          </span>
          {goldenUnlocked ? (
            <Button
              size="sm"
              variant={cosmetics.winEffect === 'goldenBurst' ? 'primary' : 'secondary'}
              onClick={() =>
                updateCosmetics((cs) => ({ ...cs, winEffect: cs.winEffect === 'goldenBurst' ? 'confetti' : 'goldenBurst' }))
              }
            >
              {cosmetics.winEffect === 'goldenBurst' ? t('common.on') : t('common.off')}
            </Button>
          ) : (
            <Button
              size="sm"
              icon="🎬"
              disabled={busy}
              onClick={() => unlockWithAd('goldenBurst', () => updateCosmetics((cs) => ({ ...cs, winEffect: 'goldenBurst' })))}
            >
              {t('ads.watch')}
            </Button>
          )}
        </div>
        <Button icon="🎓" className="full" onClick={() => updateMeta({ tutorialDone: false })}>
          {t('settings.tutorial')}
        </Button>
      </Card>

      <Card title={t('settings.data')}>
        <div className="stack">
          <Button icon="🗑️" onClick={() => setConfirm('history')}>
            {t('settings.clearHistory')}
          </Button>
          <Button icon="📉" onClick={() => setConfirm('stats')}>
            {t('settings.resetStats')}
          </Button>
          <Button variant="danger" icon="⚠️" onClick={() => setConfirm('data')}>
            {t('settings.resetData')}
          </Button>
        </div>
      </Card>

      <Card title={t('settings.about')}>
        <div className="stack">
          <Button icon="🔒" onClick={() => nav.navigate('legal', { doc: 'privacy' })}>
            {t('settings.privacy')}
          </Button>
          <Button icon="📄" onClick={() => nav.navigate('legal', { doc: 'terms' })}>
            {t('settings.terms')}
          </Button>
          {adsSupported() && (
            <Button icon="🛡️" onClick={() => showPrivacyOptions()}>
              {t('settings.adPrivacy')}
            </Button>
          )}
        </div>
        <div className="version">
          {t('app.name')} · {t('settings.version')} {APP_VERSION}
        </div>
      </Card>

      <ConfirmDialog
        open={!!c}
        title={c?.title}
        text={c?.text}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          c.run();
          setConfirm(null);
        }}
      />
    </Screen>
  );
}
