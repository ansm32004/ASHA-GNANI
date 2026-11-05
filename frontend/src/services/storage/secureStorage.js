
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore does not allow @ or other special characters in keys.
const getSafeKey = (key) =>
  String(key).replace(/[^a-zA-Z0-9._-]/g, '_');

export const secureStorage = {
  setItem: async (key, value) => {
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
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }

      const value = await SecureStore.getItemAsync(getSafeKey(key));

      if (value !== null) return value;

      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[secureStorage] Failed to get ${key}:`, e.message);

      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  deleteItem: async (key) => {
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
