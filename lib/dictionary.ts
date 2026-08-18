// /lib/dictionary.ts

import type DictionaryType from '@/lib/dictionaries/en.json';
import defaultDictionary from '@/lib/dictionaries/en.json';

export type Dictionary = typeof DictionaryType;
export { defaultDictionary };

const dictionaries = {
  en: () => import('@/lib/dictionaries/en.json').then((m) => m.default as Dictionary),
  es: () => import('@/lib/dictionaries/es.json').then((m) => m.default as Dictionary),
  de: () => import('@/lib/dictionaries/de.json').then((m) => m.default as Dictionary),
  it: () => import('@/lib/dictionaries/it.json').then((m) => m.default as Dictionary),
  fr: () => import('@/lib/dictionaries/fr.json').then((m) => m.default as Dictionary),
};

export const getDictionary = async (lang: string): Promise<Dictionary> => {
  const normalizedLang = lang.toLowerCase();
  const baseLang = normalizedLang.split('-')[0];
  type SupportedLang = keyof typeof dictionaries;
  if (normalizedLang in dictionaries) {
    return dictionaries[normalizedLang as SupportedLang]();
  }
  if (baseLang in dictionaries) {
    return dictionaries[baseLang as SupportedLang]();
  }
  return dictionaries.en();
};

