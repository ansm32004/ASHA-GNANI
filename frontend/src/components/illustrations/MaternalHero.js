import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * MaternalHero Illustration
 * Mature, elegant editorial illustration of an expectant Indian mother in layered organic landscape.
 * Palette: Soft Coral (#F28B79), Teal (#27A69A), Deep Blue (#195FA9), Soft Warm Cream.
 */
export const MaternalHero = ({ width = 160, height = 140 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 170" fill="none">
    <Defs>
      <LinearGradient id="matBackdrop" x1="20" y1="10" x2="180" y2="160" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.coralLight} stopOpacity="0.8" />
        <Stop offset="0.6" stopColor={colors.tealLight} stopOpacity="0.6" />
        <Stop offset="1" stopColor="#EBF4FE" stopOpacity="0.7" />
      </LinearGradient>
      <LinearGradient id="matMotherGrad" x1="60" y1="30" x2="140" y2="150" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.coral} />
        <Stop offset="1" stopColor="#DE6E5C" />
      </LinearGradient>
      <LinearGradient id="matSariDrape" x1="80" y1="50" x2="130" y2="140" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor={colors.deepBlue} />
      </LinearGradient>
      <LinearGradient id="matAura" x1="100" y1="30" x2="100" y2="150" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFF1EE" />
        <Stop offset="1" stopColor="#F6FAF9" />
      </LinearGradient>
    </Defs>

    {/* Layered Organic Background Shapes */}
    <Path
      d="M10 85 C25 25, 95 10, 150 25 C190 35, 195 90, 185 130 C175 160, 115 165, 65 160 C20 155, -5 130, 10 85 Z"
      fill="url(#matBackdrop)"
    />
    <Circle cx="150" cy="50" r="28" fill="#FFF8F5" opacity="0.9" />
    <Circle cx="158" cy="45" r="18" fill={colors.coralLight} opacity="0.6" />

    {/* Botanical Flourish (Editorial leaf accents) */}
    <Path
      d="M165 95 C175 80, 190 85, 188 105 C186 120, 172 120, 165 95 Z"
      fill={colors.mint}
      opacity="0.7"
    />
    <Path
      d="M172 108 C185 102, 195 112, 188 128 C182 138, 170 132, 172 108 Z"
      fill={colors.teal}
      opacity="0.4"
    />
    <Path
      d="M25 110 C15 95, 20 80, 32 82 C42 84, 40 102, 25 110 Z"
      fill={colors.mint}
      opacity="0.5"
    />

    {/* Reassuring Inner Glow */}
    <Ellipse cx="102" cy="95" rx="52" ry="58" fill="url(#matAura)" />

    {/* Mother Silhouette & Form */}
    {/* Hair Bun / Profile */}
    <Circle cx="86" cy="42" r="10" fill="#202631" />
    <Ellipse cx="98" cy="46" rx="12" ry="14" fill="#202631" />
    {/* Profile Face & Neck (Gentle, dignified contour) */}
    <Path
      d="M96 50 C104 53, 107 58, 105 64 C104 69, 101 73, 98 76 L100 84 L92 84 L91 76 Z"
      fill="#F6D4BC"
    />
    {/* Bindi Accent */}
    <Circle cx="105" cy="56" r="1.2" fill={colors.coral} />

    {/* Elegant Sari Pallu drape */}
    <Path
      d="M84 72 C80 58, 100 48, 112 55 C122 62, 126 78, 122 92 C118 106, 112 124, 114 148 C108 149, 98 149, 94 148 C92 130, 88 110, 84 72 Z"
      fill="url(#matSariDrape)"
      opacity="0.9"
    />

    {/* Mother Torso & Pregnant Silhouette */}
    <Path
      d="M93 84 C85 88, 76 96, 75 110 C74 125, 78 138, 86 148 C94 149, 114 149, 124 148 C135 146, 142 135, 140 120 C138 106, 128 95, 114 88 Z"
      fill="url(#matMotherGrad)"
    />

    {/* Gentle Hands Cradling the Bump */}
    <Path
      d="M98 116 C105 118, 118 120, 126 114 C128 116, 127 122, 120 125 C112 128, 102 126, 96 122 Z"
      fill="#F6D4BC"
    />
    {/* Coral Bangle on wrist */}
    <Circle cx="98" cy="119" r="2.5" stroke={colors.yellow} strokeWidth="1" fill="none" />

    {/* Reassuring Hearth / Wellbeing Symbol */}
    <Circle cx="100" cy="155" r="3" fill={colors.coral} opacity="0.6" />
    <Circle cx="110" cy="155" r="2" fill={colors.teal} opacity="0.5" />
    <Circle cx="90" cy="155" r="2" fill={colors.yellow} opacity="0.6" />
  </Svg>
);

export default MaternalHero;

