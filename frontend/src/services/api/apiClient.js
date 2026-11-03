import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine default API host
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:8008/api/v1',
  ios: 'http://localhost:8008/api/v1',
  default: 'http://localhost:8008/api/v1'
});

export const apiClient = axios.create({
  baseURL: DEFAULT_HOST,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@sahayika_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Could not read auth token for request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

