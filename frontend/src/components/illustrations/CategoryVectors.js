import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * Custom 2D Vector Illustration Language for SAHAYIKA
 * Designed with simple geometric shapes, rounded forms, subtle depth,
 * and carefully calibrated category palettes (Coral, Teal, Mint, Lavender, Yellow, Blue).
 */

export const MaternalHealthVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="maternalGrad" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.coral} />
        <Stop offset="1" stopColor="#E2725F" />
      </LinearGradient>
    </Defs>
    {/* Soft backdrop disc */}
    <Circle cx="18" cy="18" r="16" fill={colors.coralLight} />
    {/* Mother silhouette curve */}
    <Path
      d="M18 10C19.6569 10 21 8.65685 21 7C21 5.34315 19.6569 4 18 4C16.3431 4 15 5.34315 15 7C15 8.65685 16.3431 10 18 10Z"
      fill="url(#maternalGrad)"
    />
    {/* Mother holding child gentle shape */}
    <Path
      d="M13 14C11.3431 14 10 15.3431 10 17V23C10 26.866 13.134 30 17 30C20.866 30 24 26.866 24 23V19C24 16.2386 21.7614 14 19 14H13Z"
      fill="url(#maternalGrad)"
    />
    {/* Baby heart in tummy */}
    <Path
      d="M17.5 21C16.6716 21 16 21.6716 16 22.5C16 23.8 17.5 25 17.5 25C17.5 25 19 23.8 19 22.5C19 21.6716 18.3284 21 17.5 21Z"
      fill={colors.surface}
    />
  </Svg>
);

export const ChildHealthVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="childGrad" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.mint} />
        <Stop offset="1" stopColor="#25A278" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.mintLight} />
    {/* Baby face */}
    <Circle cx="18" cy="16" r="7.5" fill="url(#childGrad)" />
    {/* Cute baby tuft */}
    <Path
      d="M18 8.5C18 6.5 19.5 6 19.5 6"
      stroke={colors.tealDark}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Happy eyes */}
    <Circle cx="15.5" cy="15.5" r="1" fill={colors.surface} />
    <Circle cx="20.5" cy="15.5" r="1" fill={colors.surface} />
    {/* Smile */}
    <Path
      d="M16 18.5C16.8 19.5 19.2 19.5 20 18.5"
      stroke={colors.surface}
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Baby onesie wrap */}
    <Path
      d="M12 25C12 22.5 14.5 21.5 18 21.5C21.5 21.5 24 22.5 24 25C24 28 21.3137 29.5 18 29.5C14.6863 29.5 12 28 12 25Z"
      fill={colors.teal}
    />
  </Svg>
);

export const VaccinationVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="vaxGrad" x1="10" y1="8" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor="#1E857B" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.tealLight} />
    {/* Shield backdrop */}
    <Path
      d="M18 7L24 9.5V16C24 20.5 21.5 24.5 18 26C14.5 24.5 12 20.5 12 16V9.5L18 7Z"
      fill={colors.surface}
      stroke={colors.teal}
      strokeWidth="1.2"
    />
    {/* Vaccine Syringe */}
    <Rect
      x="16.5"
      y="11"
      width="3"
      height="8"
      rx="1.5"
      fill="url(#vaxGrad)"
    />
    <Rect
      x="15"
      y="10"
      width="6"
      height="1.5"
      rx="0.75"
      fill={colors.tealDark}
    />
    {/* Plunger */}
    <Path
      d="M18 19V22M16 22H20"
      stroke={colors.tealDark}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Needle tip */}
    <Path
      d="M18 10V7"
      stroke={colors.tealDark}
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </Svg>
);

export const NutritionVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="nutriGrad" x1="10" y1="10" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.yellow} />
        <Stop offset="1" stopColor="#E5A62D" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.yellowLight} />
    {/* Nutrition bowl */}
    <Path
      d="M11 18C11 23 14 26 18 26C22 26 25 23 25 18H11Z"
      fill="url(#nutriGrad)"
    />
    {/* Healthy apple / fruit sitting in bowl */}
    <Circle cx="15.5" cy="15" r="3.5" fill={colors.coral} />
    {/* Leaf */}
    <Path
      d="M15.5 11.5C17 10 19 11 19 11C19 11 18 13 16.5 12"
      fill={colors.mint}
    />
    {/* Grain stalk */}
    <Path
      d="M20 17C21 14 23 13 23 13"
      stroke={colors.tealDark}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Circle cx="22" cy="14" r="1.2" fill={colors.yellow} />
    <Circle cx="20.5" cy="16" r="1" fill={colors.yellow} />
  </Svg>
);

export const HouseholdVisitVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="houseGrad" x1="10" y1="10" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primary} />
        <Stop offset="1" stopColor={colors.deepBlue} />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.primaryLight} />
    {/* Roof */}
    <Path
      d="M9 17L18 9L27 17"
      stroke="url(#houseGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* House Body */}
    <Rect
      x="12"
      y="16"
      width="12"
      height="10"
      rx="2"
      fill="url(#houseGrad)"
    />
    {/* Doorway / Heart */}
    <Path
      d="M16 26V21C16 20 17 19.5 18 19.5C19 19.5 20 20 20 21V26H16Z"
      fill={colors.surface}
    />
  </Svg>
);

export const CommunityAssistanceVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="commGrad" x1="10" y1="8" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.lavender} />
        <Stop offset="1" stopColor="#7E6DD3" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.lavenderLight} />
    {/* Helping hand shape */}
    <Path
      d="M11 20C11 17 14 15 18 15C22 15 25 17 25 20V23C25 25 22.5 27 18 27C13.5 27 11 25 11 23V20Z"
      fill="url(#commGrad)"
    />
    {/* People connected */}
    <Circle cx="14" cy="12" r="2.5" fill="url(#commGrad)" />
    <Circle cx="22" cy="12" r="2.5" fill="url(#commGrad)" />
    <Circle cx="18" cy="10" r="2.8" fill={colors.lavender} />
  </Svg>
);

export const FollowUpVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="calGrad" x1="10" y1="10" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primary} />
        <Stop offset="1" stopColor="#1E857B" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.primaryLight} />
    {/* Calendar body */}
    <Rect
      x="11"
      y="11"
      width="14"
      height="14"
      rx="3"
      fill={colors.surface}
      stroke="url(#calGrad)"
      strokeWidth="1.8"
    />
    {/* Calendar header bar */}
    <Path
      d="M11 16H25"
      stroke="url(#calGrad)"
      strokeWidth="1.8"
    />
    {/* Binder pegs */}
    <Path
      d="M15 9V12M21 9V12"
      stroke={colors.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Checkmark inside */}
    <Path
      d="M15 20L17 22L21 18"
      stroke={colors.teal}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const VoiceAssistantVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="voiceGrad" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primary} />
        <Stop offset="1" stopColor="#6C5CE7" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.primaryLight} />
    {/* Mic capsule */}
    <Rect
      x="15.5"
      y="10"
      width="5"
      height="9"
      rx="2.5"
      fill="url(#voiceGrad)"
    />
    {/* Sound receiver cradle */}
    <Path
      d="M13 16C13 18.7614 15.2386 21 18 21C20.7614 21 23 18.7614 23 16"
      stroke={colors.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Base stem */}
    <Path
      d="M18 21V25M14 25H22"
      stroke={colors.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Sparkle sound waves */}
    <Circle cx="10.5" cy="13.5" r="1" fill={colors.coral} />
    <Circle cx="25.5" cy="13.5" r="1" fill={colors.mint} />
  </Svg>
);

export const EmergencySupportVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="16" fill={colors.dangerLight} />
    {/* Red emergency cross */}
    <Path
      d="M16 11H20V15H24V19H20V23H16V19H12V15H16V11Z"
      fill={colors.danger}
    />
  </Svg>
);

export const ClaimsIncentiveVector = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Defs>
      <LinearGradient id="claimGrad" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.yellow} />
        <Stop offset="1" stopColor="#E2A028" />
      </LinearGradient>
    </Defs>
    <Circle cx="18" cy="18" r="16" fill={colors.yellowLight} />
    {/* Rupee Coin Disc */}
    <Circle cx="18" cy="18" r="9" fill="url(#claimGrad)" />
    {/* Rupee Symbol ₹ */}
    <Path
      d="M15 14H21M15 16.5H20M15 14V21M17 19L20.5 23"
      stroke={colors.surface}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Tasteful 2D/3D Hero Illustration for NHM Scheme Card
 */
export const SchemeHeroIllustration = ({ width = 80, height = 70 }) => (
  <Svg width={width} height={height} viewBox="0 0 90 80" fill="none">
    <Defs>
      <LinearGradient id="heroTealGrad" x1="10" y1="10" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.teal} />
        <Stop offset="1" stopColor="#1E857B" />
      </LinearGradient>
      <LinearGradient id="cardDocGrad" x1="30" y1="20" x2="70" y2="75" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.surface} />
        <Stop offset="1" stopColor={colors.surfaceSecondary} />
      </LinearGradient>
    </Defs>
    {/* Soft decorative background orb */}
    <Circle cx="50" cy="40" r="32" fill="#D3EFEA" opacity="0.8" />
    <Circle cx="70" cy="24" r="10" fill={colors.mintLight} />
    <Circle cx="24" cy="54" r="7" fill={colors.yellowLight} />

    {/* Medical clipboard / record binder */}
    <Rect
      x="28"
      y="18"
      width="34"
      height="46"
      rx="6"
      fill="url(#cardDocGrad)"
      stroke={colors.teal}
      strokeWidth="1.8"
    />
    {/* Clip */}
    <Rect x="38" y="14" width="14" height="6" rx="2" fill={colors.teal} />
    
    {/* Document lines */}
    <Rect x="35" y="27" width="20" height="3" rx="1.5" fill={colors.tealLight} />
    <Rect x="35" y="34" width="16" height="2.5" rx="1.25" fill="#C5E7E1" />
    <Rect x="35" y="40" width="18" height="2.5" rx="1.25" fill="#C5E7E1" />

    {/* Green verification badge with check */}
    <Circle cx="54" cy="52" r="9" fill={colors.teal} />
    <Path
      d="M50 52L53 55L58 49"
      stroke={colors.surface}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Expressive Hero Voice Assistant Pod Illustration
 */
export const VoiceStudioHeroVector = ({ size = 96 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="heroMicGrad" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primary} />
        <Stop offset="1" stopColor={colors.deepBlue} />
      </LinearGradient>
      <LinearGradient id="soundOrb" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <Stop stopColor={colors.primaryLight} stopOpacity="0.8" />
        <Stop offset="1" stopColor="#D9EBFD" stopOpacity="0.4" />
      </LinearGradient>
    </Defs>
    {/* Soft sound sphere */}
    <Circle cx="50" cy="50" r="44" fill="url(#soundOrb)" />
    <Circle cx="50" cy="50" r="34" fill={colors.surface} />

    {/* Microphone Body */}
    <Rect
      x="43"
      y="28"
      width="14"
      height="26"
      rx="7"
      fill="url(#heroMicGrad)"
    />
    {/* Cradle */}
    <Path
      d="M36 46C36 53.732 42.268 60 50 60C57.732 60 64 53.732 64 46"
      stroke={colors.primary}
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Stand */}
    <Path
      d="M50 60V70M40 70H60"
      stroke={colors.primary}
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Floating colourful frequency accents */}
    <Circle cx="24" cy="40" r="3" fill={colors.coral} />
    <Circle cx="20" cy="52" r="2" fill={colors.mint} />
    <Circle cx="76" cy="42" r="3" fill={colors.yellow} />
    <Circle cx="80" cy="54" r="2" fill={colors.lavender} />
  </Svg>
);

