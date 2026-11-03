import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';

// Supported language definitions
export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', script: 'Devanagari', isReady: true },
  { code: 'en', name: 'English', englishName: 'English', script: 'Latin', isReady: true },
  { code: 'bho', name: 'भोजपुरी', englishName: 'Bhojpuri', script: 'Devanagari', isReady: false },
  { code: 'or', name: 'ଓଡ଼ିଆ', englishName: 'Odia', script: 'Odia', isReady: false },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', script: 'Bengali', isReady: false },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', script: 'Devanagari', isReady: false },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', script: 'Telugu', isReady: false },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', script: 'Tamil', isReady: false },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', script: 'Kannada', isReady: false },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', script: 'Malayalam', isReady: false },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', script: 'Gujarati', isReady: false },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', script: 'Gurmukhi', isReady: false }
];

const resources = {
  en: { translation: en },
  hi: { translation: hi }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'hi', // Default to Hindi for ASHA workers in India
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

