import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * NutritionIllustration
 * Wholesome nutrition, POSHAN balanced diet & wellness illustration.
 * Palette: Warm Amber (#F4C76A), Soft Mint (#9BD7C2), Teal (#27A69A), Coral.
 */
export const NutritionIllustration = ({ width = 120, height = 110 }) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    <Defs>
      <LinearGradient id="nutriBackdrop" x1="15" y1="10" x2="125" y2="110" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.yellowLight} stopOpacity="0.85" />
        <Stop offset="0.6" stopColor={colors.mintLight} stopOpacity="0.6" />
        <Stop offset="1" stopColor="#FBFDF8" />
      </LinearGradient>
      <LinearGradient id="bowlGrad" x1="40" y1="50" x2="100" y2="90" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor="#1E857B" />
      </LinearGradient>
      <LinearGradient id="grainGrad" x1="50" y1="35" x2="90" y2="65" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.yellow} />
        <Stop offset="1" stopColor="#E49F28" />
      </LinearGradient>
    </Defs>

    {/* Layered Rounded Backdrop */}
    <Path
      d="M16 55 C16 26, 36 12, 70 12 C104 12, 124 26, 124 55 C124 84, 104 108, 70 108 C36 108, 16 84, 16 55 Z"
      fill="url(#nutriBackdrop)"
    />

    {/* Sun-ripened Warm Circle */}
    <Circle cx="102" cy="36" r="16" fill="#FDF3DC" />
    <Circle cx="102" cy="36" r="9" fill={colors.yellow} opacity="0.3" />

    {/* Nutritious Leaves / Greens */}
    <Path
      d="M52 42 C44 32, 50 20, 64 22 C70 30, 62 44, 52 42 Z"
      fill={colors.mint}
    />
    <Path
      d="M58 42 C54 36, 60 26, 68 28 C74 34, 68 44, 58 42 Z"
      fill={colors.teal}
      opacity="0.7"
    />

    {/* Fresh Apple / Fruit Accent */}
    <Circle cx="86" cy="46" r="11" fill={colors.coral} />
    <Path
      d="M86 35 C88 32, 92 32, 93 30"
      stroke="#5A3A1E"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M90 32 C93 30, 96 33, 94 36 Z"
      fill={colors.mint}
    />

    {/* Wholesome Grain Pile */}
    <Ellipse cx="70" cy="55" rx="26" ry="12" fill="url(#grainGrad)" />
    <Circle cx="62" cy="52" r="2.5" fill="#FFFFFF" opacity="0.8" />
    <Circle cx="72" cy="50" r="2.5" fill="#FFFFFF" opacity="0.8" />
    <Circle cx="78" cy="53" r="2" fill="#FFFFFF" opacity="0.8" />

    {/* Wholesome Nutrition Bowl */}
    <Path
      d="M38 56 C40 82, 100 82, 102 56 H38 Z"
      fill="url(#bowlGrad)"
    />
    {/* Bowl Rim Highlight */}
    <Path
      d="M40 56 C50 60, 90 60, 100 56"
      stroke={colors.surface}
      strokeWidth="2"
      opacity="0.3"
      strokeLinecap="round"
    />

    {/* Bowl Pedestal Base */}
    <Rect x="58" y="80" width="24" height="4" rx="2" fill="#1A6E65" />

    {/* Vitality Dots */}
    <Circle cx="34" cy="50" r="2.5" fill={colors.coral} opacity="0.7" />
    <Circle cx="40" cy="38" r="2" fill={colors.yellow} opacity="0.7" />
    <Circle cx="106" cy="65" r="2.5" fill={colors.mint} opacity="0.8" />
  </Svg>
);

export default NutritionIllustration;

