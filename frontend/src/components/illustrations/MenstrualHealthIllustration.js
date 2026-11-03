import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * MenstrualHealthIllustration
 * Sophisticated, dignified, and comfortable women's wellness composition.
 * Palette: Lavender (#A99AE8), Soft Coral (#F28B79), Soft Mint, Pure White.
 */
export const MenstrualHealthIllustration = ({ width = 120, height = 110 }) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    <Defs>
      <LinearGradient id="mensBackdrop" x1="15" y1="10" x2="125" y2="110" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.lavenderLight} stopOpacity="0.85" />
        <Stop offset="0.7" stopColor={colors.coralLight} stopOpacity="0.5" />
        <Stop offset="1" stopColor="#F9F6FE" />
      </LinearGradient>
      <LinearGradient id="mensMoonGrad" x1="40" y1="20" x2="100" y2="90" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.lavender} />
        <Stop offset="1" stopColor="#7E68D3" />
      </LinearGradient>
      <LinearGradient id="mensDropGrad" x1="65" y1="45" x2="75" y2="75" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.coral} />
        <Stop offset="1" stopColor="#DE6E5C" />
      </LinearGradient>
    </Defs>

    {/* Layered Organic Pill Backdrop */}
    <Path
      d="M15 60 C15 30, 35 15, 70 15 C105 15, 125 30, 125 60 C125 90, 105 108, 70 108 C35 108, 15 90, 15 60 Z"
      fill="url(#mensBackdrop)"
    />

    {/* Elegant Cyclical Moon Motif */}
    <Path
      d="M50 35 C65 25, 88 28, 98 42 C85 45, 75 58, 78 74 C80 82, 85 88, 92 92 C75 98, 55 92, 45 76 C35 60, 38 43, 50 35 Z"
      fill="url(#mensMoonGrad)"
      opacity="0.85"
    />

    {/* Inner Harmonious Disc */}
    <Circle cx="70" cy="62" r="26" fill={colors.surface} opacity="0.9" />

    {/* Reassuring Droplet of Balance */}
    <Path
      d="M70 48 C70 48, 62 60, 62 66 C62 70.4 65.6 74 70 74 C74.4 74, 78 70.4, 78 66 C78 60, 70 48, 70 48 Z"
      fill="url(#mensDropGrad)"
    />

    {/* Serene Botanical Leaves */}
    <Path
      d="M94 58 C104 50, 114 54, 112 68 C108 76, 98 74, 94 58 Z"
      fill={colors.mint}
      opacity="0.8"
    />
    <Path
      d="M98 70 C106 66, 114 72, 110 82 C106 88, 98 84, 98 70 Z"
      fill={colors.lavender}
      opacity="0.5"
    />
    <Path
      d="M28 65 C22 55, 25 45, 34 46 C42 47, 40 60, 28 65 Z"
      fill={colors.mint}
      opacity="0.6"
    />

    {/* Calendar / Cycle Balance Markers */}
    <Circle cx="48" cy="64" r="2" fill={colors.lavender} opacity="0.7" />
    <Circle cx="54" cy="78" r="2" fill={colors.lavender} opacity="0.7" />
    <Circle cx="86" cy="78" r="2" fill={colors.lavender} opacity="0.7" />
    <Circle cx="92" cy="64" r="2" fill={colors.lavender} opacity="0.7" />
  </Svg>
);

export default MenstrualHealthIllustration;

