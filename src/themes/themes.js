/**
 * Theme registry. Themes only change appearance (CSS variables), never gameplay.
 * To add a theme: append an entry here and its `theme.<id>` i18n key.
 * `unlock` describes how the theme is obtained: 'free' | 'reward' (rewarded ad, temporary)
 * | 'purchase' (reserved for future cosmetic packs).
 */
export const THEMES = [
  {
    id: 'classic',
    unlock: 'free',
    dark: false,
    vars: {
      '--bg': 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 60%, #e0f2fe 100%)',
      '--bg-solid': '#f1f5f9',
      '--surface': '#ffffff',
      '--surface-2': '#eef2f7',
      '--text': '#0f172a',
      '--text-muted': '#475569',
      '--primary': '#4f46e5',
      '--primary-text': '#ffffff',
      '--x': '#e11d48',
      '--o': '#2563eb',
      '--grid': '#cbd5e1',
      '--win': '#f59e0b',
      '--border': '#e2e8f0',
      '--shadow': '0 6px 20px rgba(15, 23, 42, 0.08)',
    },
  },
  {
    id: 'night',
    unlock: 'free',
    dark: true,
    vars: {
      '--bg': 'linear-gradient(160deg, #0b1020 0%, #111827 60%, #1e1b4b 100%)',
      '--bg-solid': '#0f172a',
      '--surface': '#1e293b',
      '--surface-2': '#273449',
      '--text': '#f1f5f9',
      '--text-muted': '#a5b4c8',
      '--primary': '#818cf8',
      '--primary-text': '#0b1020',
      '--x': '#fb7185',
      '--o': '#60a5fa',
      '--grid': '#334155',
      '--win': '#fbbf24',
      '--border': '#334155',
      '--shadow': '0 6px 24px rgba(0, 0, 0, 0.35)',
    },
  },
  {
    id: 'ocean',
    unlock: 'free',
    dark: true,
    vars: {
      '--bg': 'linear-gradient(170deg, #03324a 0%, #065a82 55%, #0e7490 100%)',
      '--bg-solid': '#064663',
      '--surface': '#0b4f6c',
      '--surface-2': '#0f6283',
      '--text': '#ecfeff',
      '--text-muted': '#a5e4f0',
      '--primary': '#22d3ee',
      '--primary-text': '#042f3f',
      '--x': '#fda4af',
      '--o': '#a7f3d0',
      '--grid': '#1a7ea3',
      '--win': '#fde047',
      '--border': '#1a7ea3',
      '--shadow': '0 6px 24px rgba(2, 30, 45, 0.45)',
    },
  },
  {
    id: 'neon',
    unlock: 'free',
    dark: true,
    vars: {
      '--bg': 'radial-gradient(circle at 30% 10%, #2a0845 0%, #0a0014 70%)',
      '--bg-solid': '#0a0014',
      '--surface': '#1a0b2e',
      '--surface-2': '#26123f',
      '--text': '#faf5ff',
      '--text-muted': '#c4b5fd',
      '--primary': '#f0abfc',
      '--primary-text': '#1a0b2e',
      '--x': '#ff2e88',
      '--o': '#22f2ff',
      '--grid': '#5b21b6',
      '--win': '#faff00',
      '--border': '#4c1d95',
      '--shadow': '0 0 22px rgba(240, 171, 252, 0.25)',
      '--glow': '0 0 12px currentColor',
    },
  },
  {
    id: 'minimal',
    unlock: 'free',
    dark: false,
    vars: {
      '--bg': '#fafafa',
      '--bg-solid': '#fafafa',
      '--surface': '#ffffff',
      '--surface-2': '#f4f4f5',
      '--text': '#18181b',
      '--text-muted': '#52525b',
      '--primary': '#18181b',
      '--primary-text': '#fafafa',
      '--x': '#18181b',
      '--o': '#71717a',
      '--grid': '#d4d4d8',
      '--win': '#16a34a',
      '--border': '#e4e4e7',
      '--shadow': 'none',
    },
  },
  {
    // Bonus theme unlocked temporarily by a voluntary rewarded ad.
    id: 'aurora',
    unlock: 'reward',
    dark: true,
    vars: {
      '--bg': 'linear-gradient(160deg, #052e2b 0%, #134e4a 35%, #4c1d95 100%)',
      '--bg-solid': '#0f3b3a',
      '--surface': '#153f45',
      '--surface-2': '#1d5058',
      '--text': '#f0fdfa',
      '--text-muted': '#a7f3d0',
      '--primary': '#5eead4',
      '--primary-text': '#042f2e',
      '--x': '#f9a8d4',
      '--o': '#86efac',
      '--grid': '#2c6e74',
      '--win': '#fcd34d',
      '--border': '#2c6e74',
      '--shadow': '0 6px 24px rgba(0, 0, 0, 0.35)',
    },
  },
];

export const DEFAULT_THEME = 'night';

export const getTheme = (id) => THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME);

/** Applies a theme's CSS variables to the document root. */
export function applyTheme(id) {
  const theme = getTheme(id);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  if (!theme.vars['--glow']) root.style.setProperty('--glow', 'none');
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.vars['--bg-solid']);
  return theme;
}
