
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * SAHAYIKA Centralized Network & API Configuration Resolver
 *
 * Supports:
 * 1. Physical Android devices (Expo Go Metro host)
 * 2. Android emulators (10.0.2.2)
 * 3. iOS simulators (localhost)
 * 4. Expo Web / Desktop browsers
 * 5. Production and staging environments
 */

const DEFAULT_DEV_PORT = '8000';
const DEFAULT_API_PATH = '/api/v1';

/**
 * Safely extracts Metro Bundler host IP/hostname.
 */
export const getMetroHost = () => {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants?.manifest?.debuggerHost ||
      Constants?.manifest2?.extra?.manifest?.debuggerHost;

    if (hostUri && typeof hostUri === 'string') {
      const parts = hostUri.split(':');

      if (parts[0] && parts[0].trim()) {
        return parts[0].trim();
      }
    }
  } catch (e) {
    // Non-fatal fallback
  }

  return null;
};

/**
 * Normalizes API URL and ensures /api/v1 suffix.
 */
export const normalizeApiUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let cleaned = rawUrl.trim().replace(/\/+$/, '');

  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}${DEFAULT_API_PATH}`;
  }

  return cleaned;
};

/**
 * Resolves the active API Base URL.
 */
export const resolveApiBaseUrl = (customEnv = {}) => {
  const env = {
    EXPO_PUBLIC_API_BASE_URL:
      customEnv.EXPO_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_BASE_URL,

    EXPO_PUBLIC_API_URL:
      customEnv.EXPO_PUBLIC_API_URL ||
      process.env.EXPO_PUBLIC_API_URL,

    EXPO_PUBLIC_ENV:
      customEnv.EXPO_PUBLIC_ENV ||
      process.env.EXPO_PUBLIC_ENV ||
      'development',

    EXPO_PUBLIC_BACKEND_PORT:
      customEnv.EXPO_PUBLIC_BACKEND_PORT ||
      process.env.EXPO_PUBLIC_BACKEND_PORT ||
      DEFAULT_DEV_PORT
  };

  const configuredUrl = (
    env.EXPO_PUBLIC_API_BASE_URL ||
    env.EXPO_PUBLIC_API_URL ||
    ''
  ).trim();

  const port = env.EXPO_PUBLIC_BACKEND_PORT;

  const isProduction =
    env.EXPO_PUBLIC_ENV === 'production' ||
    env.EXPO_PUBLIC_ENV === 'prod';

  const isStaging = env.EXPO_PUBLIC_ENV === 'staging';

  // 1. Production environment
  if (isProduction) {
    return normalizeApiUrl(
      configuredUrl || 'https://sahayika-backend.onrender.com'
    );
  }

  // 2. Staging environment
  if (isStaging) {
    return normalizeApiUrl(
      configuredUrl || 'https://staging-api.sahayika.gov.in'
    );
  }

  // 3. Web Platform (Browser)
  if (Platform.OS === 'web') {
    // IMPORTANT: Always prioritize an explicitly configured backend URL.
    // This prevents the deployed frontend from calling itself on port 8000.
    if (configuredUrl) {
      return normalizeApiUrl(configuredUrl);
    }

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname || 'localhost';

      // Render production frontend fallback
      if (hostname === 'sahayika-frontend.onrender.com') {
        return normalizeApiUrl(
          'https://sahayika-backend.onrender.com'
        );
      }

      // Local browser development fallback
      return `http://${hostname}:${port}${DEFAULT_API_PATH}`;
    }

    return `http://localhost:${port}${DEFAULT_API_PATH}`;
  }

  // 4. Physical Android / iOS device with dynamic Metro host
  const metroHost = getMetroHost();

  const isMetroHostValidIp =
    metroHost &&
    metroHost !== 'localhost' &&
    metroHost !== '127.0.0.1' &&
    !metroHost.includes('exp.direct');

  if (Device.isDevice && isMetroHostValidIp) {
    return `http://${metroHost}:${port}${DEFAULT_API_PATH}`;
  }

  // 5. Explicit public / external URL
  if (configuredUrl) {
    const isLocalhost =
      configuredUrl.includes('localhost') ||
      configuredUrl.includes('127.0.0.1');

    const isEmulatorIp = configuredUrl.includes('10.0.2.2');

    if (!isLocalhost && !isEmulatorIp) {
      return normalizeApiUrl(configuredUrl);
    }
  }

  // 6. Android emulator
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}${DEFAULT_API_PATH}`;
  }

  // 7. iOS simulator / default localhost
  return `http://localhost:${port}${DEFAULT_API_PATH}`;
};

/**
 * Active resolved API Base URL.
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Extracts origin (protocol + host + port).
 */
export const getApiOrigin = (baseUrl = API_BASE_URL) => {
  try {
    const match = baseUrl.match(/^(https?:\/\/[^/]+)/i);

    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    // Fallback
  }

  return baseUrl.replace(/\/api\/v1\/?$/, '');
};

export const API_ORIGIN = getApiOrigin(API_BASE_URL);

/**
 * Resolves audio, image and media paths.
 */
export const resolveMediaUrl = (urlOrPath) => {
  if (!urlOrPath || typeof urlOrPath !== 'string') {
    return null;
  }

  const trimmed = urlOrPath.trim();

  if (!trimmed) return null;

  // Preserve local and embedded media formats
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }

  // Relative API or static paths
  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  // Normalize audio endpoint URLs to the active backend
  const audioEndpointMatch = trimmed.match(
    /https?:\/\/[^/]+(\/api\/v1\/ai\/audio\/[^?#]+)/i
  );

  if (audioEndpointMatch && audioEndpointMatch[1]) {
    return `${API_ORIGIN}${audioEndpointMatch[1]}`;
  }

  // Normalize static audio URLs
  const staticAudioMatch = trimmed.match(
    /https?:\/\/[^/]+(\/static\/audio\/[^?#]+)/i
  );

  if (staticAudioMatch && staticAudioMatch[1]) {
    return `${API_ORIGIN}${staticAudioMatch[1]}`;
  }

  // Preserve external URLs
  return trimmed;
};

/**
 * Returns network diagnostics.
 */
export const getNetworkDiagnostics = () => {
  return {
    resolvedApiBaseUrl: API_BASE_URL,
    resolvedApiOrigin: API_ORIGIN,
    platform: Platform.OS,
    isDevice: Boolean(Device?.isDevice),
    metroHost: getMetroHost(),
    configuredEnv: process.env.EXPO_PUBLIC_ENV || 'development',
    rawConfiguredUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      null
  };
};
