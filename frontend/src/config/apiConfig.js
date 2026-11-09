import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * SAHAYIKA Centralized Network & API Configuration Resolver
 *
 * Resolves the backend API base URL and origin dynamically across:
 * 1. Physical Android devices (extracts Metro host IP automatically from Expo Go)
 * 2. Android emulators (routes to 10.0.2.2)
 * 3. iOS simulators (routes to localhost)
 * 4. Expo Web / Desktop browsers (routes to window.location.hostname)
 * 5. Production & Staging environments (explicit HTTPS domains)
 *
 * Eliminates all hardcoded local IP addresses across the codebase.
 */

const DEFAULT_DEV_PORT = '8000';
const DEFAULT_API_PATH = '/api/v1';

/**
 * Safely extracts the Metro Bundler host IP/hostname from Expo execution context.
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
    // Non-fatal, fallback to platform detection
  }
  return null;
};

/**
 * Normalizes an API base URL ensuring standard scheme and /api/v1 suffix.
 */
export const normalizeApiUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }
  return cleaned;
};

/**
 * Resolves the active API Base URL.
 */
export const resolveApiBaseUrl = (customEnv = {}) => {
  const env = {
    EXPO_PUBLIC_API_BASE_URL: customEnv.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_URL: customEnv.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_ENV: customEnv.EXPO_PUBLIC_ENV || process.env.EXPO_PUBLIC_ENV || 'development',
    EXPO_PUBLIC_BACKEND_PORT: customEnv.EXPO_PUBLIC_BACKEND_PORT || process.env.EXPO_PUBLIC_BACKEND_PORT || DEFAULT_DEV_PORT
  };

  const configuredUrl = (env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_API_URL || '').trim();
  const port = env.EXPO_PUBLIC_BACKEND_PORT;
  const isProduction = env.EXPO_PUBLIC_ENV === 'production' || env.EXPO_PUBLIC_ENV === 'prod';
  const isStaging = env.EXPO_PUBLIC_ENV === 'staging';

  // 1. Production / Staging: Always use explicit configured URL or official secure domain
  if (isProduction) {
    return normalizeApiUrl(configuredUrl || 'https://api.sahayika.gov.in');
  }
  if (isStaging) {
    return normalizeApiUrl(configuredUrl || 'https://staging-api.sahayika.gov.in');
  }

  // 2. Web Platform (Browser)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname || 'localhost';
      return `http://${hostname}:${port}${DEFAULT_API_PATH}`;
    }
    return `http://localhost:${port}${DEFAULT_API_PATH}`;
  }

  // 3. Physical Android / iOS Device with dynamic Metro Host
  // The phone just downloaded its bundle from Metro, so metroHost is the most accurate LAN IP.
  const metroHost = getMetroHost();
  const isPhysical = Device.isDevice;
  const isMetroHostValidIp = metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1' && !metroHost.includes('exp.direct');

  if (isMetroHostValidIp) {
    return `http://${metroHost}:${port}${DEFAULT_API_PATH}`;
  }

  // 4. Explicit public / external URL configured in environment (e.g. ngrok, public domain, cloud dev)
  if (configuredUrl) {
    const isLocalhost = configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1');
    const isEmulatorIp = configuredUrl.includes('10.0.2.2');

    // If configured URL is a real remote host or LAN IP, respect it directly
    if (!isLocalhost && !isEmulatorIp) {
      return normalizeApiUrl(configuredUrl);
    }
  }

  // 5. Android Emulator without Metro Host
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}${DEFAULT_API_PATH}`;
  }

  // 6. iOS Simulator / Default Localhost
  return `http://localhost:${port}${DEFAULT_API_PATH}`;
};

/**
 * Active resolved API base URL (e.g. 'http://192.168.1.41:8008/api/v1')
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Extracts origin (protocol + host + port) from the resolved API base URL.
 * (e.g. 'http://192.168.1.41:8008')
 */
export const getApiOrigin = (baseUrl = API_BASE_URL) => {
  try {
    const match = baseUrl.match(/^(https?:\/\/[^/]+)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    // fallback
  }
  return baseUrl.replace(/\/api\/v1\/?$/, '');
};

export const API_ORIGIN = getApiOrigin(API_BASE_URL);

/**
 * Resolves any audio, image, or media path to an absolute, network-independent URL.
 * Handles:
 * - null/empty -> null
 * - data URIs (data:audio/wav;base64,...) -> preserved as-is
 * - blob URIs (blob:...) -> preserved as-is
 * - local files (file://...) -> preserved as-is
 * - relative paths (/api/v1/ai/audio/xyz.wav or /static/audio/xyz.wav) -> resolved against API_ORIGIN
 * - absolute URLs pointing to old/different IPs for audio -> normalized to current API_ORIGIN
 * - third-party external URLs (e.g. Unsplash) -> preserved as-is
 */
export const resolveMediaUrl = (urlOrPath) => {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  // Local/embedded data formats
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

  // Check if this is an audio endpoint URL generated with an older or different host IP
  // (e.g. http://192.168.0.7:8008/api/v1/ai/audio/hash.wav or http://localhost:8008/api/v1/ai/audio/...)
  const audioEndpointMatch = trimmed.match(/https?:\/\/[^/]+(\/api\/v1\/ai\/audio\/[^?#]+)/i);
  if (audioEndpointMatch && audioEndpointMatch[1]) {
    return `${API_ORIGIN}${audioEndpointMatch[1]}`;
  }

  const staticAudioMatch = trimmed.match(/https?:\/\/[^/]+(\/static\/audio\/[^?#]+)/i);
  if (staticAudioMatch && staticAudioMatch[1]) {
    return `${API_ORIGIN}${staticAudioMatch[1]}`;
  }

  // Standard external URL (e.g. Unsplash, CDN)
  return trimmed;
};

/**
 * Returns network diagnostics snapshot for debugging and connection audits.
 */
export const getNetworkDiagnostics = () => {
  return {
    resolvedApiBaseUrl: API_BASE_URL,
    resolvedApiOrigin: API_ORIGIN,
    platform: Platform.OS,
    isDevice: Boolean(Device?.isDevice),
    metroHost: getMetroHost(),
    configuredEnv: process.env.EXPO_PUBLIC_ENV || 'development',
    rawConfiguredUrl: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || null
  };
};

