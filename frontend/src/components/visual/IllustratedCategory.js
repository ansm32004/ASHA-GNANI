import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, shadows, radius, spacing } from '../../theme';
import { MaternalHero } from '../illustrations/MaternalHero';
import { MenstrualHealthIllustration } from '../illustrations/MenstrualHealthIllustration';
import { ChildHealthIllustration } from '../illustrations/ChildHealthIllustration';
import { VaccinationIllustration } from '../illustrations/VaccinationIllustration';
import { NutritionIllustration } from '../illustrations/NutritionIllustration';
import { CommunityHealthIllustration } from '../illustrations/CommunityHealthIllustration';

export const CATEGORIES_DATA = [
  {
    id: 'pregnancy',
    title: 'Pregnancy Care',
    subtitle: '6 Active ANC',
    badge: 'Priority',
    accentColor: colors.coral,
    bgColor: '#FFF5F2',
    Illustration: ({ size = 70 }) => <MaternalHero width={size} height={size * 0.9} />
  },
  {
    id: 'menstrual',
    title: 'Menstrual Health',
    subtitle: 'Wellness & Kits',
    badge: 'Confidential',
    accentColor: colors.lavender,
    bgColor: '#F6F3FD',
    Illustration: ({ size = 70 }) => <MenstrualHealthIllustration width={size} height={size * 0.85} />
  },
  {
    id: 'child',
    title: 'Child Health',
    subtitle: '14 Infants & Toddlers',
    badge: 'Growth Check',
    accentColor: colors.teal,
    bgColor: colors.mintLight,
    Illustration: ({ size = 70 }) => <ChildHealthIllustration width={size} height={size * 0.85} />
  },
  {
    id: 'vaccination',
    title: 'Immunization',
    subtitle: '5 Doses Pending',
    badge: 'RI Schedule',
    accentColor: colors.primary,
    bgColor: colors.primaryLight,
    Illustration: ({ size = 70 }) => <VaccinationIllustration width={size} height={size * 0.85} />
  },
  {
    id: 'nutrition',
    title: 'POSHAN Diet',
    subtitle: 'IFA & Rations',
    badge: 'Nutrition',
    accentColor: colors.yellow,
    bgColor: colors.yellowLight,
    Illustration: ({ size = 70 }) => <NutritionIllustration width={size} height={size * 0.85} />
  },
  {
    id: 'community',
    title: 'Community Care',
    subtitle: '34 Households',
    badge: 'Village',
    accentColor: colors.deepBlue,
    bgColor: '#F0F5FA',
    Illustration: ({ size = 70 }) => <CommunityHealthIllustration width={size} height={size * 0.85} />
  }
];

export const IllustratedCategoryTile = ({
  item,
  isSelected,
  onPress
}) => {
  const { title, subtitle, badge, accentColor, bgColor, Illustration } = item;
  return (
    <TouchableOpacity
      style={[
        styles.tile,
        isSelected && { borderColor: accentColor, borderWidth: 1.5, ...shadows.raised }
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.85}
    >
      {/* Top illustration container */}
      <View style={[styles.illustrationContainer, { backgroundColor: bgColor }]}>
        <Illustration size={68} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: accentColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Info labels */}
      <View style={styles.infoArea}>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const IllustratedCategorySection = ({
  selectedId,
  onSelectCategory,
  categories = CATEGORIES_DATA
}) => {
  return (
    <View style={styles.sectionContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {categories.map((cat) => (
          <IllustratedCategoryTile
            key={cat.id}
            item={cat}
            isSelected={selectedId === cat.id}
            onPress={onSelectCategory}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: spacing.xs
  },
  scrollList: {
    paddingHorizontal: spacing.screenPadding,
    gap: 12
  },
  tile: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    ...shadows.card
  },
  illustrationContainer: {
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textWhite,
    textTransform: 'uppercase'
  },
  infoArea: {
    marginTop: 8,
    paddingHorizontal: 2
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText
  },
  subtitleText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2
  }
});

export default IllustratedCategorySection;

