import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * VaccinationIllustration
 * Clean, professional immunization & protective shield vector illustration.
 * Palette: Primary Blue (#2478D0), Teal (#27A69A), Mint (#9BD7C2), Pure White.
 */
export const VaccinationIllustration = ({ width = 120, height = 110 }) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    <Defs>
      <LinearGradient id="vaxBackdrop" x1="15" y1="10" x2="125" y2="110" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.tealLight} stopOpacity="0.85" />
        <Stop offset="0.7" stopColor="#EAF3FD" stopOpacity="0.6" />
        <Stop offset="1" stopColor="#F5F9FD" />
      </LinearGradient>
      <LinearGradient id="vaxShieldGrad" x1="45" y1="25" x2="95" y2="95" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor={colors.primary} />
      </LinearGradient>
      <LinearGradient id="vaxVialGrad" x1="60" y1="40" x2="80" y2="85" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#E0EEF9" />
      </LinearGradient>
    </Defs>

    {/* Layered Rounded Backdrop */}
    <Path
      d="M16 55 C16 26, 36 12, 70 12 C104 12, 124 26, 124 55 C124 84, 104 108, 70 108 C36 108, 16 84, 16 55 Z"
      fill="url(#vaxBackdrop)"
    />

    {/* Protective Immunity Shield Silhouette */}
    <Path
      d="M70 24 C86 32, 100 32, 104 36 C104 64, 92 88, 70 98 C48 88, 36 64, 36 36 C40 32, 54 32, 70 24 Z"
      fill="url(#vaxShieldGrad)"
      opacity="0.95"
    />

    {/* Shield Inner Gloss */}
    <Path
      d="M70 30 C82 36, 94 36, 97 40 C97 62, 87 82, 70 90 C53 82, 43 62, 43 40 C46 36, 58 36, 70 30 Z"
      fill={colors.surface}
      opacity="0.2"
    />

    {/* Vaccine Ampoule / Syringe Medical Form */}
    {/* Vial Cap */}
    <Rect x="64" y="38" width="12" height="4" rx="2" fill={colors.yellow} />
    <Rect x="66" y="42" width="8" height="3" fill="#D0D7DE" />
    {/* Glass Ampoule Body */}
    <Rect x="60" y="45" width="20" height="34" rx="4" fill="url(#vaxVialGrad)" />
    {/* Liquid Fill Level */}
    <Path
      d="M61 60 C64 59, 76 61, 79 60 V75 C79 77.2, 77.2 79, 75 79 H65 C62.8 79, 61 77.2, 61 75 Z"
      fill={colors.primary}
      opacity="0.85"
    />
    {/* Medical Measurement Marks */}
    <Path d="M64 52 H68 M64 57 H71 M64 64 H68 M64 69 H71" stroke={colors.deepBlue} strokeWidth="1.2" strokeLinecap="round" />

    {/* Protective Sparkle / Cross Accent */}
    <Circle cx="106" cy="48" r="8" fill={colors.surface} />
    <Path
      d="M106 43 V53 M101 48 H111"
      stroke={colors.teal}
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Droplet of Prevention */}
    <Path
      d="M70 28 C70 28, 66 34, 66 37 C66 39.2, 67.8 41, 70 41 C72.2 41, 74 39.2, 74 37 C74 34, 70 28, 70 28 Z"
      fill={colors.yellow}
    />
  </Svg>
);

export default VaccinationIllustration;

