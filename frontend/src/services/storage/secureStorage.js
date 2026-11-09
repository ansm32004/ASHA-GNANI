
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore does not allow @ or other special characters in keys.
const getSafeKey = (key) =>
  String(key).replace(/[^a-zA-Z0-9._-]/g, '_');

// Fast in-memory token/storage cache to eliminate native bridge overhead on every API call
const memoryCache = new Map();

export const secureStorage = {
  setItem: async (key, value) => {
    memoryCache.set(key, value);
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(getSafeKey(key), value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }
      return true;
    } catch (e) {
      console.warn(`[secureStorage] Failed to set ${key}:`, e.message);

      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  },

  getItem: async (key) => {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    try {
      if (Platform.OS === 'web') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) memoryCache.set(key, val);
        return val;
      }

      const value = await SecureStore.getItemAsync(getSafeKey(key));

      if (value !== null) {
        memoryCache.set(key, value);
        return value;
      }

      const asyncVal = await AsyncStorage.getItem(key);
      if (asyncVal !== null) memoryCache.set(key, asyncVal);
      return asyncVal;
    } catch (e) {
      console.warn(`[secureStorage] Failed to get ${key}:`, e.message);

      try {
        const fallbackVal = await AsyncStorage.getItem(key);
        if (fallbackVal !== null) memoryCache.set(key, fallbackVal);
        return fallbackVal;
      } catch {
        return null;
      }
    }
  },

  deleteItem: async (key) => {
    memoryCache.delete(key);
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(getSafeKey(key));
      }

      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[secureStorage] Failed to delete ${key}:`, e.message);

      try {
        await AsyncStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  },
};

export default secureStorage;
