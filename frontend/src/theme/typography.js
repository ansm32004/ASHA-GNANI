import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
  android: '"Plus Jakarta Sans", "Noto Sans", Roboto, sans-serif',
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif'
});

export const typography = {
  displayLarge: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.4
  },
  heading1: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3
  },
  heading2: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2
  },
  heading3: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.1
  },
  bodyLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20
  },
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16
  },
  button: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  label: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },

  // Aliases for compatibility
  h1: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28
  },
  h2: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24
  },
  h3: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22
  }
};
