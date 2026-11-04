import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Platform-safe Secure Storage Wrapper
 * Uses hardware-backed Keychain (iOS) & Keystore (Android) via expo-secure-store.
 * Gracefully falls back to AsyncStorage in web environments where SecureStore is unavailable.
 */
export const secureStorage = {
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
        });
      }
      return true;
    } catch (e) {
      console.warn(`[secureStorage] Failed to set ${key}:`, e.message);
      // Fallback in case of keystore error
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (err) {
        return false;
      }
    }
  },

  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
      // Fallback check in case key was migrated from AsyncStorage
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[secureStorage] Failed to get ${key}:`, e.message);
      try {
        return await AsyncStorage.getItem(key);
      } catch (err) {
        return null;
      }
    }
  },

  deleteItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      // Also ensure removal from AsyncStorage fallback
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[secureStorage] Failed to delete ${key}:`, e.message);
      try {
        await AsyncStorage.removeItem(key);
        return true;
      } catch (err) {
        return false;
      }
    }
  }
};

export default secureStorage;

