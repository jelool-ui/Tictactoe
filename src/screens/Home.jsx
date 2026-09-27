import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Button } from '../components/ui.jsx';
import { formatClock, formatNumber } from '../i18n/i18n.js';

function Clock() {
  const { lang } = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const { date, time } = formatClock(now, lang);
  return (
    <div className="clock" aria-label={`${date} ${time}`}>
      <span className="clock-time">{time}</span>
      <span className="clock-date">{date}</span>
    </div>
  );
}

export function Home({ nav }) {
  const { t, data, lang } = useApp();
  const { profile, stats, meta } = data;

  const quickPlay = () => {
    nav.navigate('game', {
      config: {
        mode: 'solo',
        difficulty: meta.lastDifficulty || 'intermediate',
        humanSymbol: profile.symbol,
        starter: 'human',
      },
    });
  };

  return (
    <div className="screen home with-banner">
      <main className="screen-body home-body">
        <div className="home-top">
          <button type="button" className="player-chip" onClick={() => nav.navigate('profile')}>
            <span className="avatar" aria-hidden="true">
              {profile.avatar}
            </span>
            <span className="player-chip-text">
              <span className="player-chip-name">
                {profile.name ? t('home.hello', { name: profile.name }) : t('home.helloAnon')}
              </span>
              <span className="player-chip-score">⭐ {t('common.pts', { n: formatNumber(stats.score, lang) })}</span>
            </span>
          </button>
          <Clock />
        </div>

        <div className="logo" aria-label={t('app.name')}>
          <div className="logo-marks" dir="ltr" aria-hidden="true">
            <span className="lx">X</span>
            <span className="lo">O</span>
          </div>
          <h1 className="logo-title">TIC TAC DUEL</h1>
          <p className="logo-tagline">{t('app.tagline')}</p>
        </div>

        <Button variant="primary" size="xl" className="play-btn" icon="▶" onClick={quickPlay}>
          {t('home.play')}
        </Button>

        <div className="home-modes">
          <Button size="lg" icon="🤖" onClick={() => nav.navigate('solo')}>
            {t('home.solo')}
          </Button>
          <Button size="lg" icon="👥" onClick={() => nav.navigate('duo')}>
            {t('home.duo')}
          </Button>
        </div>

        <nav className="home-menu">
          <Button icon="👤" onClick={() => nav.navigate('profile')}>
            {t('home.profile')}
          </Button>
          <Button icon="📊" onClick={() => nav.navigate('stats')}>
            {t('home.stats')}
          </Button>
          <Button icon="🏆" onClick={() => nav.navigate('trophies')}>
            {t('home.trophies')}
          </Button>
          <Button icon="📜" onClick={() => nav.navigate('history')}>
            {t('home.history')}
          </Button>
          <Button icon="⚙️" className="span-2" onClick={() => nav.navigate('settings')}>
            {t('home.settings')}
          </Button>
        </nav>
      </main>
    </div>
  );
}
