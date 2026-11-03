import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * CommunityHealthIllustration
 * ASHA frontline worker connecting with community families and village wellbeing.
 * Palette: Primary Blue (#2478D0), Deep Blue (#195FA9), Teal (#27A69A), Mint (#9BD7C2).
 */
export const CommunityHealthIllustration = ({ width = 120, height = 110 }) => (
  <Svg width={width} height={height} viewBox="0 0 140 120" fill="none">
    <Defs>
      <LinearGradient id="commBackdrop" x1="15" y1="10" x2="125" y2="110" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primaryLight} stopOpacity="0.85" />
        <Stop offset="0.6" stopColor={colors.tealLight} stopOpacity="0.5" />
        <Stop offset="1" stopColor="#F5F9FE" />
      </LinearGradient>
      <LinearGradient id="ashaSari" x1="30" y1="30" x2="60" y2="90" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primary} />
        <Stop offset="1" stopColor={colors.deepBlue} />
      </LinearGradient>
      <LinearGradient id="villagerGrad" x1="75" y1="30" x2="110" y2="90" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor="#1C776E" />
      </LinearGradient>
    </Defs>

    {/* Layered Rounded Backdrop */}
    <Path
      d="M16 55 C16 26, 36 12, 70 12 C104 12, 124 26, 124 55 C124 84, 104 108, 70 108 C36 108, 16 84, 16 55 Z"
      fill="url(#commBackdrop)"
    />

    {/* Village Home Silhouette in Soft Background */}
    <Path
      d="M60 48 L70 38 L80 48 V60 H60 Z"
      fill={colors.surface}
      opacity="0.8"
    />
    <Circle cx="106" cy="30" r="12" fill={colors.yellowLight} />

    {/* ASHA Health Worker Figure (Left) */}
    {/* Head & Hair */}
    <Circle cx="44" cy="36" r="8" fill="#202631" />
    <Path
      d="M44 42 C49 44, 50 48, 48 52 L46 58 L42 58 L40 52 Z"
      fill="#F5D5BE"
    />
    {/* Blue Saree / Uniform */}
    <Path
      d="M34 54 C30 62, 28 74, 30 88 C34 98, 52 98, 58 98 C60 90, 58 74, 52 64 C48 58, 42 54, 34 54 Z"
      fill="url(#ashaSari)"
    />
    {/* Health Register / Tablet in ASHA worker's hand */}
    <Rect x="46" y="66" width="14" height="18" rx="2" fill={colors.surface} />
    <Rect x="48" y="70" width="10" height="2" rx="1" fill={colors.primary} />
    <Rect x="48" y="74" width="7" height="2" rx="1" fill={colors.primary} />
    <Rect x="48" y="78" width="9" height="2" rx="1" fill={colors.primary} />

    {/* Community Beneficiary / Mother (Right) */}
    <Circle cx="88" cy="40" r="8" fill="#202631" />
    <Path
      d="M88 46 C92 48, 93 52, 91 56 L89 60 L85 60 L84 56 Z"
      fill="#F5D5BE"
    />
    <Path
      d="M80 58 C74 66, 72 78, 76 90 C80 98, 98 98, 104 94 C104 84, 102 70, 96 62 C92 56, 86 56, 80 58 Z"
      fill="url(#villagerGrad)"
    />

    {/* Caring Gesture Connection Line */}
    <Circle cx="66" cy="62" r="3" fill={colors.coral} opacity="0.8" />
    <Circle cx="66" cy="52" r="2" fill={colors.teal} opacity="0.6" />
    <Circle cx="68" cy="44" r="1.5" fill={colors.yellow} opacity="0.6" />
  </Svg>
);

export default CommunityHealthIllustration;

