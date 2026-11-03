import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * ChildHealthIllustration
 * Mother and child tender healthcare checkup illustration with mature, respectful proportions.
 * Palette: Teal (#27A69A), Primary Blue (#2478D0), Soft Mint (#9BD7C2), Warm Yellow (#F4C76A).
 */
export const ChildHealthIllustration = ({ width = 120, height = 110 }) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    <Defs>
      <LinearGradient id="childBackdrop" x1="10" y1="10" x2="130" y2="110" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.mintLight} stopOpacity="0.8" />
        <Stop offset="0.6" stopColor={colors.tealLight} stopOpacity="0.5" />
        <Stop offset="1" stopColor="#EAF3FD" />
      </LinearGradient>
      <LinearGradient id="chMotherGrad" x1="40" y1="20" x2="80" y2="100" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor={colors.deepBlue} />
      </LinearGradient>
      <LinearGradient id="chChildGrad" x1="60" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.yellow} />
        <Stop offset="1" stopColor="#E2A638" />
      </LinearGradient>
    </Defs>

    {/* Layered Rounded Backdrop */}
    <Path
      d="M16 55 C16 25, 38 12, 70 12 C102 12, 124 25, 124 55 C124 85, 102 108, 70 108 C38 108, 16 85, 16 55 Z"
      fill="url(#childBackdrop)"
    />

    {/* Warm Protective Sun Disc */}
    <Circle cx="106" cy="34" r="16" fill={colors.yellowLight} />
    <Circle cx="106" cy="34" r="10" fill={colors.yellow} opacity="0.4" />

    {/* Mother Silhouette Figure (Left) */}
    <Circle cx="48" cy="36" r="9" fill="#202631" />
    <Path
      d="M48 42 C53 44, 55 48, 54 52 L50 60 L44 60 L43 52 Z"
      fill="#F5D5BE"
    />
    <Path
      d="M40 56 C34 62, 32 72, 34 84 C38 96, 52 98, 62 98 C66 98, 70 94, 68 86 C66 74, 58 64, 48 58 Z"
      fill="url(#chMotherGrad)"
    />
    {/* Mother's protective arm holding child */}
    <Path
      d="M52 68 C58 72, 72 74, 82 70 C84 72, 82 76, 76 78 C68 80, 56 78, 50 74 Z"
      fill="#F5D5BE"
    />

    {/* Toddler/Child Silhouette Figure (Right, nestled comfortably) */}
    <Circle cx="86" cy="50" r="8" fill="#F5D5BE" />
    <Path
      d="M80 46 C80 43, 85 41, 88 42 C92 43, 94 48, 92 51 Z"
      fill="#202631"
    />
    {/* Child Outfit / Body */}
    <Path
      d="M76 60 C73 66, 74 76, 76 86 C82 88, 96 88, 98 84 C100 76, 98 66, 94 60 Z"
      fill="url(#chChildGrad)"
    />
    {/* Gentle child head tilt & smile indication */}
    <Circle cx="88" cy="52" r="1" fill="#202631" />

    {/* Healthy Growth / Stethoscope / Wellness Symbol */}
    <Circle cx="64" cy="98" r="4" fill={colors.teal} opacity="0.7" />
    <Path
      d="M102 70 C108 64, 114 68, 112 76 C110 82, 104 80, 102 70 Z"
      fill={colors.mint}
      opacity="0.8"
    />
  </Svg>
);

export default ChildHealthIllustration;

