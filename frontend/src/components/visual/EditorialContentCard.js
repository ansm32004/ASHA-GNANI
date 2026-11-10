import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, shadows, radius, spacing } from '../../theme';
import { NutritionIllustration } from '../illustrations/NutritionIllustration';
import { VaccinationIllustration } from '../illustrations/VaccinationIllustration';
import { MaternalHero } from '../illustrations/MaternalHero';

/**
 * EditorialContentCard
 * Editorial-style healthcare reading & scheme guideline card.
 * Sophisticated magazine layout with mature vector artwork and clear reading action.
 */
export const EditorialContentCard = ({
  badge = "National Health Mission",
  title = "Janani Suraksha Yojana (JSY)",
  summary = "Facilitate institutional delivery for registered mothers. ₹1,400 financial assistance directly credited to rural mothers, with ₹600 ASHA incentive.",
  readTime = "3 min guide",
  actionText = "View guidelines",
  onPressAction,
  illustrationType = "maternal"
}) => {
  const renderIllustration = () => {
    switch (illustrationType) {
      case 'nutrition':
        return <NutritionIllustration width={85} height={75} />;
      case 'vaccination':
        return <VaccinationIllustration width={85} height={75} />;
      case 'maternal':
      default:
        return <MaternalHero width={90} height={80} />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{tr(badge)}</Text>
        </View>
        <Text style={styles.readTimeText}>{tr(readTime)}</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <Text style={styles.titleText}>{tr(title)}</Text>
          <Text style={styles.summaryText} numberOfLines={3}>
            {tr(summary)}
          </Text>
        </View>

        <View style={styles.illustrationWrapper}>
          {renderIllustration()}
        </View>
      </View>

      {/* Editorial footer action link */}
      <TouchableOpacity
        style={styles.actionLinkRow}
        onPress={onPressAction}
        activeOpacity={0.8}
      >
        <Text style={styles.actionLinkText}>{tr(actionText)}</Text>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18L15 12L9 6"
            stroke={colors.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
    padding: spacing.cardPadding,
    ...shadows.card
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  badgePill: {
    backgroundColor: colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.tealDark,
  },
  readTimeText: {
    fontSize: 11,
    color: colors.secondaryText
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  textColumn: {
    flex: 1,
    paddingRight: 10
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    lineHeight: 20,
    marginBottom: 4
  },
  summaryText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 17
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 18,
    padding: 4
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  }
});

export default EditorialContentCard;

