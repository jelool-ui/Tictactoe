/**
 * End-to-end smoke test (Chromium, phone viewport).
 * Builds nothing: run `npm run build` first. Serves dist/ with `vite preview`,
 * then plays every mode/level, visits every screen, switches all 5 languages,
 * checks persistence and plays fully offline.
 *
 *   npm run build && npm run test:e2e
 */
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const SHOTS = process.env.E2E_SCREENSHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'error' });
const URL = 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath });
const errors = [];
let step = '';
const check = (cond, msg) => {
  if (!cond) throw new Error(`[${step}] ${msg}`);
  console.log(`  ✓ ${msg}`);
};

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function newPage(locale) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  await page.goto(URL);
  return { ctx, page };
}

const btn = (page, text) =>
  page.locator('button').filter({ hasText: text }).or(page.locator(`button[aria-label="${text}"]`)).first();
const data = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ttd.data.v1')));

/** Plays the current game by clicking random free cells until the result card shows. */
async function playRandom(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.result-card').isVisible()) break;
    const free = page.locator('.board .cell[aria-disabled="false"]');
    const n = await free.count();
    if (n > 0) await free.nth(Math.floor(Math.random() * n)).click();
    await page.waitForTimeout(n > 0 ? 120 : 250);
  }
  await page.locator('.result-card').waitFor({ timeout: 5000 });
  return (await page.locator('.result-title').textContent()).trim();
}

try {
  // ------------------------------------------------------------------ tutorial + home (French device)
  step = 'first launch';
  const { ctx, page } = await newPage('fr-FR');
  await page.locator('.tutorial').waitFor();
  check((await page.textContent('.tutorial-title')).includes('Choisissez votre mode de jeu'), 'tutorial shown in device language (fr)');
  await shot(page, '01-tutorial');
  await btn(page, 'Suivant').click();
  await btn(page, 'Suivant').click();
  check((await page.textContent('.tutorial-title')).includes('Alignez 3 symboles'), 'tutorial step 3');
  await btn(page, 'C’est parti').click();
  check(!(await page.locator('.tutorial').isVisible()), 'tutorial closed');
  check((await data(page)).meta.tutorialDone === true, 'tutorial completion saved');
  check((await page.textContent('.logo-title')) === 'TIC TAC DUEL', 'home title');
  for (const label of ['JOUER', 'SOLO', '2 JOUEURS', 'PROFIL', 'STATISTIQUES', 'TROPHÉES', 'HISTORIQUE', 'PARAMÈTRES']) {
    check(await btn(page, label).isVisible(), `home button "${label}"`);
  }
  check(/\d{2}:\d{2}/.test(await page.textContent('.clock-time')), 'device clock displayed');
  await shot(page, '02-home');

  // ------------------------------------------------------------------ offline from here
  step = 'offline play';
  await ctx.setOffline(true);

  // Quick play (JOUER)
  await btn(page, 'JOUER').click();
  await page.locator('.board').waitFor();
  check((await page.locator('.board .cell').count()) === 9, 'grid has 9 cells');
  const timerBefore = await page.textContent('.timer');
  check(timerBefore.includes('00:00'), 'timer shows 00:00 before first move');
  await page.locator('.board .cell').nth(4).click();
  check((await page.locator('.board .cell').nth(4).getAttribute('class')).includes('filled'), 'move placed');
  await page.waitForTimeout(800); // let the AI answer
  const filledBefore = await page.locator('.board .cell.filled').count();
  await page.locator('.board .cell').nth(4).click({ force: true }); // occupied: must be ignored
  await page.waitForTimeout(200);
  check((await page.locator('.board .cell.filled').count()) === filledBefore, 'occupied cell cannot be played');
  await shot(page, '03-game');
  const r0 = await playRandom(page);
  check(['VICTOIRE !', 'DÉFAITE', 'MATCH NUL !'].includes(r0), `quick game finished: ${r0}`);
  check(/\d{2}:\d{2}/.test(await page.textContent('.result-time')), 'result shows duration');
  await shot(page, '04-result');
  await btn(page, 'ACCUEIL').click();

  // Solo: 3 levels
  const results = {};
  for (const [label, key] of [['Débutant', 'beginner'], ['Intermédiaire', 'intermediate'], ['Difficile', 'hard']]) {
    await btn(page, 'SOLO').click();
    await btn(page, label).click();
    await btn(page, 'Commencer').click();
    results[key] = [];
    const games = key === 'hard' ? 4 : 2;
    for (let g = 0; g < games; g++) {
      results[key].push(await playRandom(page));
      await btn(page, g < games - 1 ? 'REJOUER' : 'ACCUEIL').click();
      await page.waitForTimeout(150);
    }
    check(results[key].length === games, `AI ${key}: ${results[key].join(', ')}`);
  }
  check(!results.hard.includes('VICTOIRE !'), 'hard AI was never beaten by random play');

  // AI starts
  await btn(page, 'SOLO').click();
  await btn(page, 'L’IA').click();
  await btn(page, 'Commencer').click();
  await page.waitForTimeout(900);
  check((await page.locator('.board .cell.filled').count()) === 1, 'AI plays first when chosen');
  await page.locator('.game .icon-btn').click(); // quit mid-game -> confirmation
  check(await page.locator('.modal').isVisible(), 'quit confirmation shown');
  await page.locator('.modal .btn-danger').click();
  check(await page.locator('.logo-title').isVisible(), 'back home after quitting');

  // 2 players
  step = 'duo';
  await btn(page, '2 JOUEURS').click();
  await page.locator('input').nth(0).fill('Zakaria');
  await page.locator('input').nth(1).fill('Sam');
  await btn(page, 'Commencer').click();
  check((await page.textContent('.turn-indicator')).includes('Au tour de Zakaria'), 'shows whose turn it is');
  for (const i of [0, 3, 1, 4]) await page.locator('.board .cell').nth(i).click();
  check((await page.textContent('.turn-indicator')).includes('Zakaria'), 'turn alternates');
  await page.locator('.board .cell').nth(2).click();
  check((await page.locator('.board .cell.win').count()) === 3, 'three winning cells highlighted');
  check(await page.locator('.win-line').isVisible(), 'winning line drawn');
  await page.locator('.result-card').waitFor();
  check((await page.textContent('.result-line1')) === 'Zakaria', 'winner name displayed');
  check((await page.textContent('.result-points')) === '+20 POINTS', '+20 points for a 2-player win');
  await shot(page, '05-duo-win');
  await btn(page, 'VOIR LES STATISTIQUES').click();

  // Stats / records
  step = 'stats';
  const d = await data(page);
  const total = 1 + 2 + 2 + 4 + 1;
  check(d.stats.gamesPlayed === total, `games played saved (${d.stats.gamesPlayed})`);
  check(d.stats.wins + d.stats.losses + d.stats.draws === total, 'wins + losses + draws = games');
  check(d.stats.winsDuo === 1, 'duo win counted');
  check(d.history.length === total, 'history has every game');
  check((await page.textContent('.screen-title')) === 'Statistiques', 'statistics screen');
  check((await page.textContent('.screen-body')).includes('Mes records'), 'records section');
  await shot(page, '06-stats');
  await btn(page, 'Retour').click();

  // Profile
  step = 'profile';
  await btn(page, 'PROFIL').click();
  await page.locator('input').fill('Zakaria');
  await btn(page, 'Enregistrer').click();
  await page.locator('.avatar-option').nth(3).click();
  await page.locator('.segment').nth(1).click();
  const p = (await data(page)).profile;
  check(p.name === 'Zakaria' && p.avatar === '🐼' && p.symbol === 'O', 'profile saved (name, avatar, symbol)');
  for (const l of ['Parties jouées', 'Victoires', 'Défaites', 'Matchs nuls', 'Score total', 'Série de victoires', 'Meilleure série', 'Victoires contre l’IA', 'Victoires en mode 2 joueurs', 'Niveau IA le plus joué']) {
    check((await page.textContent('.screen-body')).includes(l), `profile shows "${l}"`);
  }
  await shot(page, '07-profile');
  await btn(page, 'Retour').click();

  // Trophies
  step = 'trophies';
  await btn(page, 'TROPHÉES').click();
  check((await page.locator('.trophy').count()) === 9, '9 trophies listed');
  check((await page.locator('.trophy.unlocked', { hasText: 'Première victoire' }).count()) === 1, '"Première victoire" unlocked');
  check((await page.locator('.trophy.locked').count()) > 0, 'locked trophies shown');
  await shot(page, '08-trophies');
  await btn(page, 'Retour').click();

  // History
  step = 'history';
  await btn(page, 'HISTORIQUE').click();
  check((await page.locator('.history-item').count()) === total, 'history list');
  const first = await page.textContent('.history-item');
  check(/\d{2}\/\d{2}\/\d{4} — \d{2}:\d{2}/.test(first) && first.includes('2 joueurs — contre Sam') && first.includes('Durée'), `history entry: ${first}`);
  await shot(page, '09-history');
  await btn(page, 'Retour').click();

  // Settings — everything, offline
  step = 'settings';
  await btn(page, 'PARAMÈTRES').click();
  for (const [code, sample, dir] of [
    ['en', 'Settings', 'ltr'],
    ['de', 'Einstellungen', 'ltr'],
    ['es', 'Ajustes', 'ltr'],
    ['ar', 'الإعدادات', 'rtl'],
    ['fr', 'Paramètres', 'ltr'],
  ]) {
    await page.locator(`.lang-option[lang="${code}"]`).click();
    check((await page.textContent('.screen-title')) === sample, `language ${code}: title "${sample}"`);
    check((await page.getAttribute('html', 'dir')) === dir && (await page.getAttribute('html', 'lang')) === code, `language ${code}: dir=${dir}`);
    if (code === 'ar') await shot(page, '10-settings-ar');
  }
  for (const th of ['classic', 'ocean', 'neon', 'minimal', 'night']) {
    await page.locator('.theme-option', { hasText: { classic: 'Classique', ocean: 'Océan', neon: 'Néon', minimal: 'Minimal', night: 'Nuit' }[th] }).click();
    check((await page.getAttribute('html', 'data-theme')) === th, `theme ${th} applied`);
  }
  const toggles = page.locator('[role="switch"]');
  check((await toggles.count()) === 4, '4 toggles (sounds, music, vibrations, timer)');
  for (let i = 0; i < 4; i++) await toggles.nth(i).click();
  let s = (await data(page)).settings;
  check(!s.sound && !s.music && !s.vibration && !s.timer, 'toggles off saved');
  for (let i = 0; i < 4; i++) await toggles.nth(i).click();
  s = (await data(page)).settings;
  check(s.sound && s.music && s.vibration && s.timer, 'toggles on saved');
  await page.locator('input[type="range"]').fill('40');
  check((await data(page)).settings.volume === 0.4, 'volume saved');

  await btn(page, 'Politique de confidentialité').click();
  check((await page.textContent('.legal')).includes('AdMob'), 'privacy policy');
  await btn(page, 'Retour').click();
  await btn(page, 'Conditions d’utilisation').click();
  check((await page.textContent('.screen-title')) === 'Conditions d’utilisation', 'terms');
  await btn(page, 'Retour').click();
  check((await page.textContent('.version')).includes('1.0.0'), 'version 1.0.0 displayed');

  // Timer off → hidden in game
  await toggles.nth(3).click();
  await btn(page, 'Retour').click();
  await btn(page, 'JOUER').click();
  check((await page.locator('.timer').count()) === 0, 'timer hidden when disabled');
  await page.locator('.game .icon-btn').click();
  await btn(page, 'PARAMÈTRES').click();
  await page.locator('[role="switch"]').nth(3).click();

  // Destructive actions need confirmation
  await btn(page, 'Supprimer l’historique').click();
  await btn(page, 'Annuler').click();
  check((await data(page)).history.length === total, 'cancel keeps history');
  await btn(page, 'Supprimer l’historique').click();
  await page.locator('.modal .btn-danger').click();
  check((await data(page)).history.length === 0, 'history deleted after confirmation');
  await btn(page, 'Réinitialiser les statistiques').click();
  await page.locator('.modal .btn-danger').click();
  check((await data(page)).stats.gamesPlayed === 0, 'statistics reset after confirmation');

  // ------------------------------------------------------------------ persistence
  step = 'persistence';
  await ctx.setOffline(false);
  await btn(page, 'Retour').click();
  await btn(page, 'JOUER').click();
  await playRandom(page);
  await btn(page, 'ACCUEIL').click();
  await page.reload();
  await page.locator('.logo-title').waitFor();
  const after = await data(page);
  check(after.stats.gamesPlayed === 1 && after.history.length === 1 && after.profile.name === 'Zakaria', 'data survives an app restart');
  check(!(await page.locator('.tutorial').isVisible()), 'tutorial not shown again');

  step = 'reset data';
  await btn(page, 'PARAMÈTRES').click();
  await btn(page, 'Réinitialiser les données').click();
  await page.locator('.modal .btn-danger').click();
  await page.locator('.tutorial').waitFor();
  check((await data(page)).stats.gamesPlayed === 0, 'all data reset → tutorial shown again');
  await ctx.close();

  // ------------------------------------------------------------------ language auto-detection
  step = 'language detection';
  for (const [locale, code, text] of [['ar-SA', 'ar', 'العب'], ['de-DE', 'de', 'SPIELEN'], ['es-ES', 'es', 'JUGAR'], ['en-US', 'en', 'PLAY'], ['ja-JP', 'en', 'PLAY']]) {
    const { ctx: c2, page: p2 } = await newPage(locale);
    await p2.locator('.link-btn').click(); // skip tutorial
    check((await p2.getAttribute('html', 'lang')) === code && (await btn(p2, text).isVisible()), `${locale} → ${code}`);
    if (code === 'ar') {
      check((await p2.getAttribute('html', 'dir')) === 'rtl', 'Arabic uses RTL');
      await shot(p2, '11-home-ar');
    }
    await c2.close();
  }

  check(errors.length === 0, `no runtime errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  console.log('\nE2E smoke test passed.');
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  if (errors.length) console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
