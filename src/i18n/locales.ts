import { en } from './en';
import { ru } from './ru';
import type { TranslationDictionary } from './types';

function mergeLocale(partial: Partial<TranslationDictionary>): TranslationDictionary {
  return {
    numberUnits: partial.numberUnits ?? en.numberUnits,
    timeUnits: { ...en.timeUnits, ...partial.timeUnits },
    nav: { ...en.nav, ...partial.nav },
    common: { ...en.common, ...partial.common },
    hub: { ...en.hub, ...partial.hub },
    spts: { ...en.spts, ...partial.spts },
    sptl: { ...en.sptl, ...partial.sptl },
    calc: { ...en.calc, ...partial.calc },
    settingsModal: { ...en.settingsModal, ...partial.settingsModal },
    profiles: { ...en.profiles, ...partial.profiles },
    help: { ...en.help, ...partial.help },
    legal: { ...en.legal, ...partial.legal }
  };
}

export const LOCALE_REGISTRY = [
  { code: 'en', label: 'EN', nativeName: 'English', dict: en },
  { code: 'ru', label: 'RU', nativeName: 'Русский', dict: mergeLocale(ru) }
] as const;

export type LocaleCode = (typeof LOCALE_REGISTRY)[number]['code'];

export function getDictionary(code: LocaleCode): TranslationDictionary {
  return LOCALE_REGISTRY.find((l) => l.code === code)?.dict ?? en;
}

const RU_LIKE_CODES = ['ru', 'uk', 'be', 'kk'];

export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language
  ].filter(Boolean);

  for (const raw of candidates) {
    const lower = raw.toLowerCase();
    const matched = LOCALE_REGISTRY.find((l) => lower.startsWith(l.code));
    if (matched) return matched.code;
    if (RU_LIKE_CODES.some((c) => lower.startsWith(c))) return 'ru';
  }
  return 'en';
}
