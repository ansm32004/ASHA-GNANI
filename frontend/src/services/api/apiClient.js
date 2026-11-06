import axios from 'axios';
import { Platform } from 'react-native';
import { secureStorage } from '../storage/secureStorage';

// Base URL resolution priority:
// 1. Web -> localhost / process.env.EXPO_PUBLIC_API_URL
// 2. Physical device via Expo Go -> Dev machine LAN IP (192.168.1.41)
// 3. Explicit production or custom remote EXPO_PUBLIC_API_URL
const resolveBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:8008/api/v1';
  }
  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    // Physical mobile device connected via Expo Go
    return 'http://192.168.1.41:8008/api/v1';
  }
  return envUrl;
};

const RESOLVED_BASE_URL = resolveBaseUrl();

const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 10000;

export const apiClient = axios.create({
  baseURL: RESOLVED_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Optional callback listener for session expiration (401)
let onUnauthorizedHandler = null;

export const setOnUnauthorizedHandler = (handler) => {
  onUnauthorizedHandler = handler;
};

// Request interceptor: attach hardware-backed JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('@sahayika_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // In case storage read fails, continue request unauthenticated
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle timeouts, 401s and standardize network errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with an error status (4xx, 5xx)
      if (error.response.status === 401) {
        // Token expired or invalid
        if (typeof onUnauthorizedHandler === 'function') {
          onUnauthorizedHandler();
        }
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.isTimeout = true;
      error.userFriendlyMessage = 'Request timed out. Please check your network connection.';
    } else if (!error.response) {
      error.isNetworkError = true;
      error.userFriendlyMessage = 'Cannot connect to SAHAYIKA server. Please verify your connection.';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
