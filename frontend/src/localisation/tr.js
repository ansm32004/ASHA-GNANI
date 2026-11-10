import i18n from './index';
import hiStrings from './strings.hi.json';
import enStrings from './strings.en.json';

// Source text written as "हिंदी (English)" shows only the active language.
const BILINGUAL = /^(.*[ऀ-ॿ].*?)\s*\(([^()ऀ-ॿ]*[a-z][^()ऀ-ॿ]*)\)$/;

// Translates text at the point it is displayed. Anything without an entry is
// returned unchanged, so names, numbers and React nodes pass through safely.
export const tr = (value) => {
  if (typeof value !== 'string') return value;
  const key = value.trim();
  if (!key) return value;
  const isHindi = i18n.language === 'hi';
  const translated = (isHindi ? hiStrings : enStrings)[key];
  if (translated !== undefined) return value.replace(key, translated);
  if (key.includes(' • ')) return value.replace(key, key.split(' • ').map(tr).join(' • '));
  const bilingual = key.match(BILINGUAL);
  if (bilingual) return value.replace(key, isHindi ? bilingual[1].trim() : bilingual[2].trim());
  return value;
};
