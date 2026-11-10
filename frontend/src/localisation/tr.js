import i18n from './index';
import hiStrings from './strings.hi.json';
import enStrings from './strings.en.json';

// Source text written as "हिंदी (English)" shows only the active language.
const BILINGUAL = /^(.*[ऀ-ॿ].*?)\s*\(([^()ऀ-ॿ]*[a-z][^()ऀ-ॿ]*)\)$/;

// Translates text at the point it is displayed. Anything without an entry is
// returned unchanged, so names, numbers and React nodes pass through safely.
export const tr = (rawValue) => {
  if (typeof rawValue !== 'string') return rawValue;
  // AI replies can contain Markdown bold markers.
  const value = rawValue.replace(/\*\*/g, '');
  const key = value.trim();
  if (!key) return value;
  const isHindi = i18n.language === 'hi';
  const translated = (isHindi ? hiStrings : enStrings)[key];
  if (translated !== undefined) return value.replace(key, translated);
  if (key.includes(' • ')) return value.replace(key, key.split(' • ').map(tr).join(' • '));
  if (key.includes(' / ')) return value.replace(key, key.split(' / ').map(tr).join(' / '));
  const counted = key.match(/^(\d+) (\D.*)$/);
  if (counted) return value.replace(key, `${counted[1]} ${tr(counted[2])}`);
  const example = key.match(/^e\.g\. (.+)$/);
  if (example && isHindi) return value.replace(key, `जैसे ${tr(example[1])}`);
  const today = key.match(/^(Today|Yesterday|Tomorrow), (.+)$/);
  if (today) return value.replace(key, `${tr(today[1])}, ${today[2]}`);
  const labelled = key.match(/^([^:]{2,40}):\s+(.+)$/);
  if (labelled && (isHindi ? hiStrings : enStrings)[`${labelled[1]}:`] !== undefined) {
    return value.replace(key, `${(isHindi ? hiStrings : enStrings)[`${labelled[1]}:`]} ${tr(labelled[2])}`);
  }
  const bilingual = key.match(BILINGUAL);
  if (bilingual) return value.replace(key, isHindi ? bilingual[1].trim() : bilingual[2].trim());
  return value;
};
