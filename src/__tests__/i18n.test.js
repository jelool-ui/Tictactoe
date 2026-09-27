import { describe, expect, it } from 'vitest';
import { MESSAGES, createT } from '../i18n/i18n.js';
import { detectLanguage, LANGUAGES } from '../i18n/languages.js';
import { ACHIEVEMENTS } from '../achievements/achievements.js';
import { THEMES } from '../themes/themes.js';

const enKeys = Object.keys(MESSAGES.en).sort();

describe('i18n', () => {
  it.each(LANGUAGES.map((l) => l.code))('%s has exactly the same keys as English, all non-empty', (code) => {
    expect(Object.keys(MESSAGES[code]).sort()).toEqual(enKeys);
    for (const v of Object.values(MESSAGES[code])) expect(v.trim().length).toBeGreaterThan(0);
  });
  it('keeps placeholders consistent across languages', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const code of Object.keys(MESSAGES)) {
      for (const k of enKeys) expect(`${code}:${k}:${ph(MESSAGES[code][k])}`).toBe(`${code}:${k}:${ph(MESSAGES.en[k])}`);
    }
  });
  it('has texts for every trophy and theme', () => {
    for (const a of ACHIEVEMENTS) {
      expect(MESSAGES.en[`ach.${a.id}.title`]).toBeTruthy();
      expect(MESSAGES.en[`ach.${a.id}.desc`]).toBeTruthy();
    }
    for (const th of THEMES) expect(MESSAGES.en[`theme.${th.id}`]).toBeTruthy();
  });
  it('interpolates and pluralises', () => {
    const fr = createT('fr');
    expect(fr('result.wonBy', { name: 'Zakaria' })).toBe('Zakaria a gagné !');
    expect(fr.plural('result.points', 0)).toBe('+0 POINT');
    expect(fr.plural('result.points', 20)).toBe('+20 POINTS');
    expect(createT('en').plural('result.points', 1)).toBe('+1 POINT');
  });
  it('detects the device language', () => {
    expect(detectLanguage({ languages: ['ar-SA'], language: 'ar-SA' })).toBe('ar');
    expect(detectLanguage({ languages: ['it-IT', 'es-ES'] })).toBe('es');
    expect(detectLanguage({ languages: ['ja-JP'] })).toBe('en');
  });
});
