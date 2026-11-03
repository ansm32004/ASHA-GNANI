import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif'
});

export const typography = {
  displayLarge: {
    fontFamily,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.5
  },
  heading1: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3
  },
  heading2: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2
  },
  heading3: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22
  },
  bodyLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15
  },
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  },
  label: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.2
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
