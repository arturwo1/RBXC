import { useAppStore } from '../store/useAppStore';
import { getDictionary, type LocaleCode } from './locales';
import type { TranslationDictionary } from './types';

export { detectBrowserLocale, getDictionary, LOCALE_REGISTRY, type LocaleCode } from './locales';
export type { TranslationDictionary } from './types';

export function useT(): TranslationDictionary {
  const language = useAppStore((s) => s.settings.language) as LocaleCode;
  return getDictionary(language);
}
