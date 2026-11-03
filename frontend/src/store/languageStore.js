import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localisation';

export const useLanguageStore = create((set, get) => ({
  uiLanguage: 'hi',
  voiceLanguage: 'hi',

  initializeLanguage: async () => {
    try {
      const storedUi = await AsyncStorage.getItem('@sahayika_ui_lang');
      const storedVoice = await AsyncStorage.getItem('@sahayika_voice_lang');
      if (storedUi) {
        await i18n.changeLanguage(storedUi);
        set({ uiLanguage: storedUi, voiceLanguage: storedVoice || storedUi });
      }
    } catch (e) {
      console.error('Error loading language preferences', e);
    }
  },

  setUiLanguage: async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      await AsyncStorage.setItem('@sahayika_ui_lang', langCode);
      set({ uiLanguage: langCode });
    } catch (e) {
      console.error('Error changing UI language', e);
    }
  },

  setVoiceLanguage: async (langCode) => {
    try {
      await AsyncStorage.setItem('@sahayika_voice_lang', langCode);
      set({ voiceLanguage: langCode });
    } catch (e) {
      console.error('Error changing voice language', e);
    }
  }
}));

