import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, shadows, radius, spacing, typography } from '../../theme';
import { MaternalHero } from '../illustrations/MaternalHero';

/**
 * ImmersiveHero
 * Mature, illustration-led hero section with layered organic environmental background,
 * clear editorial heading, and an integrated floating white voice action panel.
 */
export const ImmersiveHero = ({
  headline = "Your family's health, one step at a time.",
  tagline = "Empowering maternal, child & community wellness across Rampur Kalan.",
  onPressVoice,
  voicePrompt = "Tap to speak in Hindi or English..."
}) => {
  return (
    <View style={styles.container}>
      {/* Layered Organic Backdrop Svg */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="heroSkyGrad" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#EAF1FF" stopOpacity="0.9" />
              <Stop offset="0.6" stopColor="#F2F8FC" stopOpacity="0.8" />
              <Stop offset="1" stopColor={colors.background} />
            </LinearGradient>
            <LinearGradient id="softWaveTeal" x1="0" y1="80" x2="400" y2="220" gradientUnits="userSpaceOnUse">
              <Stop stopColor={colors.tealLight} stopOpacity="0.45" />
              <Stop offset="1" stopColor="#E0EEFA" stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          <Path d="M0 0 H400 V220 C320 235, 180 238, 0 215 Z" fill="url(#heroSkyGrad)" />
          <Path d="M0 120 C110 100, 220 145, 400 115 V225 C310 240, 150 235, 0 215 Z" fill="url(#softWaveTeal)" />
          <Circle cx="350" cy="45" r="55" fill={colors.yellowLight} opacity="0.4" />
          <Circle cx="30" cy="180" r="40" fill={colors.coralLight} opacity="0.3" />
        </Svg>
      </View>

      {/* Hero Visual Content Row */}
      <View style={styles.heroContentRow}>
        <View style={styles.heroTextColumn}>
          <View style={styles.pillBadge}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{tr('COMMUNITY CARE')}</Text>
          </View>
          <Text style={styles.headlineText}>{tr(headline)}</Text>
          <Text style={styles.taglineText}>{tr(tagline)}</Text>
        </View>

        {/* Mature Maternal Illustration */}
        <View style={styles.illustrationWrapper}>
          <MaternalHero width={135} height={125} />
        </View>
      </View>

      {/* Floating Integrated Voice Action Panel */}
      <TouchableOpacity
        style={styles.floatingVoiceBar}
        onPress={onPressVoice}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={tr('Open voice assistant')}
      >
        <View style={styles.micCircle}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
              fill={colors.surface}
            />
            <Path
              d="M19 10V11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11V10H7V11C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11V10H19Z"
              fill={colors.surface}
            />
          </Svg>
        </View>

        <View style={styles.voicePromptColumn}>
          <Text style={styles.voiceTitle}>{tr('Voice Companion')}</Text>
          <Text style={styles.voiceSubtitle} numberOfLines={1}>{tr(voicePrompt)}</Text>
        </View>

        <View style={styles.askButton}>
          <Text style={styles.askButtonText}>{tr('Speak')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden'
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  heroTextColumn: {
    flex: 1,
    paddingRight: spacing.sm
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFCC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginRight: 6
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.deepBlue,
  },
  headlineText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    lineHeight: 26,
    letterSpacing: -0.2
  },
  taglineText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 17,
    marginTop: 4
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingVoiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    ...shadows.card
  },
  micCircle: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  voicePromptColumn: {
    flex: 1
  },
  voiceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  voiceSubtitle: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1
  },
  askButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryMuted
  },
  askButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  }
});

export default ImmersiveHero;

