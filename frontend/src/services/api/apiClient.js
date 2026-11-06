import axios from 'axios';
import { secureStorage } from '../storage/secureStorage';
import {
  API_BASE_URL,
  API_ORIGIN,
  resolveApiBaseUrl,
  resolveMediaUrl,
  getNetworkDiagnostics
} from '../../config/apiConfig';

// Backwards-compatible alias for existing imports
export const resolveBaseUrl = resolveApiBaseUrl;
export { API_BASE_URL, API_ORIGIN, resolveMediaUrl, getNetworkDiagnostics };

const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 12000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor: handle timeouts, 401s, 403s, and standardize network errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const targetUrl = error?.config?.url || 'server';

    if (error.response) {
      const status = error.response.status;
      error.isServerError = status >= 500;
      error.isAuthError = status === 401 || status === 403;

      if (status === 401) {
        error.userFriendlyMessage = 'Session expired. Please log in again.';
        if (typeof onUnauthorizedHandler === 'function') {
          onUnauthorizedHandler();
        }
      } else if (status === 403) {
        error.userFriendlyMessage = 'Access denied. You do not have permission for this action.';
      } else if (status >= 500) {
        error.userFriendlyMessage = 'Server error. Please try again in a few moments.';
      } else {
        error.userFriendlyMessage = error.response?.data?.detail || error.response?.data?.message || 'Request failed.';
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      error.isTimeout = true;
      error.isNetworkError = true;
      error.userFriendlyMessage = `Connection to SAHAYIKA server timed out. Please check your network and verify the server is running at ${API_BASE_URL}.`;
    } else {
      // No response received - Network failure (e.g. ECONNREFUSED, ENOTFOUND, offline)
      error.isNetworkError = true;
      error.userFriendlyMessage = `Cannot connect to SAHAYIKA server at ${API_BASE_URL}. Please check your Wi-Fi/data connection.`;
    }

    error.targetUrl = targetUrl;
    return Promise.reject(error);
  }
);

export default apiClient;
