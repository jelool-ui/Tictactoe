/** Minimal, dependency-free i18n: interpolation + plural rules + locale-aware formatting. */
import en from './locales/en.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import es from './locales/es.js';
import ar from './locales/ar.js';
import { FALLBACK_LANGUAGE } from './languages.js';

export const MESSAGES = { en, fr, de, es, ar };

const interpolate = (str, params) =>
  params ? str.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? String(params[k]) : m)) : str;

const pluralRulesCache = {};
const pluralRules = (lang) => (pluralRulesCache[lang] ??= new Intl.PluralRules(lang));

// French treats 0 as singular ("+0 POINT"); Intl.PluralRules('fr') already does this.

/** Creates a translate function for `lang`. */
export function createT(lang) {
  const dict = MESSAGES[lang] ?? MESSAGES[FALLBACK_LANGUAGE];
  const fallback = MESSAGES[FALLBACK_LANGUAGE];
  const t = (key, params) => {
    let str = dict[key] ?? fallback[key];
    if (str === undefined) return key;
    return interpolate(str, params);
  };
  /** Plural-aware translation: uses `<key>_<category>` then `<key>_other`. */
  t.plural = (key, n, params) => {
    const cat = pluralRules(lang).select(n);
    const k = dict[`${key}_${cat}`] !== undefined ? `${key}_${cat}` : `${key}_other`;
    return t(k, { n, ...params });
  };
  t.lang = lang;
  return t;
}

/** Formats a timestamp as date + time with the device time zone, e.g. 17/09/2026 — 23:52. */
export function formatDateTime(ts, lang) {
  const d = new Date(ts);
  const date = new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${date} — ${time}`;
}

export function formatDate(ts, lang) {
  return new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts));
}

export function formatClock(ts, lang) {
  const d = new Date(ts);
  return {
    date: new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d),
    time: new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(d),
  };
}

export const formatNumber = (n, lang) => new Intl.NumberFormat(lang).format(n);
