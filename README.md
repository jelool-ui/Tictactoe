# Tic Tac Duel

A fast, modern, **fully offline** Tic-Tac-Toe (Morpion) for Android, built with **React + Vite** and packaged with **Capacitor 8**.

- Solo vs AI (Beginner / Intermediate / Hard — Hard is perfect play, unbeatable) and 2 players on one phone
- Animated 3×3 grid, winning line, distinct synthesized sounds for X, O, victory, defeat, draw, clicks and trophies, discreet ambient music
- Local profile (nickname, avatar, favourite symbol), statistics, score, records, 9 trophies, history with date/time/duration
- 5 languages (FR, EN, DE, ES, AR with full RTL), auto-detected on first launch
- 5 free themes + 1 bonus theme (rewarded ad, 24 h), haptics, timer, 3-step tutorial
- Discreet AdMob: banner on menu screens only, rare interstitials between games, optional rewarded ads
- No account, no server: everything is stored on the device (localStorage + native SharedPreferences mirror)

## Project structure

```
src/
  engine/        game rules: win / draw detection (pure functions)
  ai/            offline AI, 3 levels (minimax + alpha-beta, memoized)
  stats/         statistics reducers + scoring rules
  achievements/  trophy definitions
  history/       game history
  profile/       avatars, name sanitising
  settings/      default settings
  themes/        theme registry (CSS variables) — add a theme = add an entry
  cosmetics/     cosmetic catalog (future packs: themes, X/O styles, effects, sounds)
  i18n/          translations (locales/*.js), language detection, formatting
  audio/         Web Audio synthesized SFX + ambient music (no audio files)
  platform/      haptics + native glue (splash, status bar, back button)
  ads/           AdMob config (test/prod), pacing policy, crash-proof service
  storage/       persistence
  state/         app state (React context) + data model / migrations
  components/    UI building blocks (Board, Mark, Timer, dialogs…)
  screens/       Home, Solo/Duo setup, Game, Result, Profile, Stats, Trophies, History, Settings, Legal, Tutorial
android/         Capacitor Android project
resources/       icon sources (SVG), Play Store icon 512 px, feature graphic 1024×500
scripts/         asset generator, end-to-end smoke test
docs/            privacy policy to host for Google Play
```

## Development

Requirements: Node 22+, JDK 21, Android Studio (Android SDK 36).

```bash
npm install
npm run dev          # web preview in the browser (ads are disabled on the web)
npm test             # unit tests (engine, exhaustive AI check, stats, trophies, i18n parity…)
npm run build && npm run test:e2e   # full end-to-end smoke test in Chromium (offline play, all screens, 5 languages)
npm run cap:sync     # build web app + copy into android/
npm run android:open # open in Android Studio → Run
```

## Configuration before publishing

| What | Where |
|---|---|
| Package name (applicationId) | `android/gradle.properties` → `APP_ID` (also `appId` in `capacitor.config.json`) |
| Version | `package.json` `version`, `android/gradle.properties` → `VERSION_NAME`, `VERSION_CODE` (increment each upload) |
| AdMob **app** id | `android/gradle.properties` → `ADMOB_APP_ID` (default = Google test id) |
| AdMob **ad unit** ids | copy `.env.production.example` → `.env.production.local`, set `VITE_ADMOB_USE_TEST_IDS=false` and the 3 ids |
| Interstitial frequency | `src/ads/adConfig.js` (default: max 1 every 4 games and 4 minutes, never in the first 3 games) |
| Upload key | copy `android/keystore.properties.example` → `android/keystore.properties` |
| Icons / splash | edit `resources/*.svg`, then `npm run assets` |
| Privacy policy URL | host `docs/privacy-policy.md` and add the URL in Play Console |

During development Google's **test ad ids** are always used (`.env`), so no invalid traffic is generated.

## Release build (AAB for Google Play)

```bash
cp .env.production.example .env.production.local   # fill in real AdMob ids
# set ADMOB_APP_ID / APP_ID / VERSION_* in android/gradle.properties
# create android/keystore.properties
npm run android:release
# → android/app/build/outputs/bundle/release/app-release.aab
```

Play Console checklist: Data safety form (AdMob collects device/advertising IDs, approximate location; app data stays on device), "Contains ads" = yes, content rating questionnaire, target audience 13+ recommended (AdMob), store icon `resources/play-store-icon-512.png`, feature graphic `resources/play-store-feature-graphic.png`.

## Scoring

| Result | Points |
|---|---|
| Win vs AI — Beginner / Intermediate / Hard | +10 / +20 / +30 |
| Win in 2-player mode (player 1 = device owner) | +20 |
| Draw | +5 |
| Defeat | 0 (points are never removed) |
