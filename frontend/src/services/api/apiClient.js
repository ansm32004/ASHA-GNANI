import axios from 'axios';
import { secureStorage } from '../storage/secureStorage';
import { tr } from '../../localisation/tr';
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

// The free Render backend sleeps when idle and takes up to about a minute to
// wake, so sign-in requests get a longer timeout than regular requests.
export const AUTH_TIMEOUT_MS = 70000;

// Starts waking the backend early (called from the splash screen) so it is
// ready by the time the user signs in. /health does not touch the database.
let warmUpStarted = false;
export const warmUpServer = () => {
  if (warmUpStarted) return;
  warmUpStarted = true;
  axios.get(`${API_ORIGIN}/health`, { timeout: AUTH_TIMEOUT_MS }).catch(() => {
    warmUpStarted = false;
  });
};

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
        error.userFriendlyMessage = tr('Session expired. Please log in again.');
        if (typeof onUnauthorizedHandler === 'function') {
          onUnauthorizedHandler();
        }
      } else if (status === 403) {
        error.userFriendlyMessage = tr('Access denied. You do not have permission for this action.');
      } else if (status >= 500) {
        error.userFriendlyMessage = tr('Server error. Please try again in a few moments.');
      } else {
        error.userFriendlyMessage = tr(error.response?.data?.detail || error.response?.data?.message || 'Request failed.');
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      error.isTimeout = true;
      error.isNetworkError = true;
      error.userFriendlyMessage = tr('Connection to the SAHAYIKA server timed out. Please check your network and try again.');
    } else {
      // No response received - Network failure (e.g. ECONNREFUSED, ENOTFOUND, offline)
      error.isNetworkError = true;
      error.userFriendlyMessage = tr('Cannot connect to the SAHAYIKA server. Please check your Wi-Fi/data connection.');
    }

    error.targetUrl = targetUrl;
    return Promise.reject(error);
  }
);

export default apiClient;
