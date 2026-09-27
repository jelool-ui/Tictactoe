/**
 * Generates the Android launcher icons, splash screens, the web favicon and
 * the Play Store icon (512×512) from the SVG sources in /resources.
 * Usage: npm run assets
 */
import sharp from 'sharp';
import { mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(root, 'android/app/src/main/res');
const icon = readFileSync(join(root, 'resources/icon.svg'));
const fg = readFileSync(join(root, 'resources/icon-foreground.svg'));
const SPLASH_BG = '#0f172a';

const out = async (buf, file) => {
  mkdirSync(dirname(file), { recursive: true });
  await buf.toFile(file);
};
const render = (svg, size) => sharp(svg, { density: Math.ceil((size / 108) * 72 * 1.5) }).resize(size, size);

const round = (size) =>
  Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
const rounded = (size) =>
  Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}"/></svg>`);

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

for (const [d, k] of Object.entries(DENSITIES)) {
  const legacy = Math.round(48 * k);
  const fgSize = Math.round(108 * k);
  const dir = join(res, `mipmap-${d}`);
  // Legacy icons: rounded square and circle
  const full = await render(icon, legacy).png().toBuffer();
  await out(sharp(full).composite([{ input: rounded(legacy), blend: 'dest-in' }]).png(), join(dir, 'ic_launcher.png'));
  await out(sharp(full).composite([{ input: round(legacy), blend: 'dest-in' }]).png(), join(dir, 'ic_launcher_round.png'));
  // Adaptive foreground
  await out(render(fg, fgSize).png(), join(dir, 'ic_launcher_foreground.png'));
}

// Splash screens (pre-Android 12 full-screen images): centred icon on the dark background.
const SPLASHES = {
  drawable: [480, 320],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
};
for (const [folder, [w, h]] of Object.entries(SPLASHES)) {
  const s = Math.round(Math.min(w, h) * 0.34);
  const logo = await render(icon, s).png().toBuffer();
  const logoRounded = await sharp(logo).composite([{ input: rounded(s), blend: 'dest-in' }]).png().toBuffer();
  await out(
    sharp({ create: { width: w, height: h, channels: 4, background: SPLASH_BG } })
      .composite([{ input: logoRounded, gravity: 'center' }])
      .png(),
    join(res, folder, 'splash.png'),
  );
}

// Play Store icon + web favicon
await out(render(icon, 512).png(), join(root, 'resources/play-store-icon-512.png'));
copyFileSync(join(root, 'resources/icon.svg'), join(root, 'public/icon.svg'));

// Play Store feature graphic 1024×500
const fgLogo = await render(icon, 300).png().toBuffer();
await out(
  sharp({ create: { width: 1024, height: 500, channels: 4, background: SPLASH_BG } })
    .composite([
      { input: await sharp(fgLogo).composite([{ input: rounded(300), blend: 'dest-in' }]).png().toBuffer(), left: 90, top: 100 },
      {
        input: Buffer.from(
          `<svg width="560" height="500"><text x="0" y="230" font-family="Arial, sans-serif" font-weight="900" font-size="78" fill="#f1f5f9">TIC TAC</text><text x="0" y="320" font-family="Arial, sans-serif" font-weight="900" font-size="78" fill="#818cf8">DUEL</text></svg>`,
        ),
        left: 440,
        top: 0,
      },
    ])
    .png(),
  join(root, 'resources/play-store-feature-graphic.png'),
);

console.log('Assets generated.');
