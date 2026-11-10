import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';

export const TealInfoCard = ({
  badge = 'Health Scheme Update',
  title = 'Janani Suraksha Yojana (JSY)',
  description = 'Encourage institutional deliveries. Rural mothers receive ₹1,400 financial assistance upon PHC delivery.',
  actionText = 'Learn more',
  onPressAction,
  icon = 'gift-outline'
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{tr(badge)}</Text>
          </View>
          <Text style={styles.titleText}>{tr(title)}</Text>
          <Text style={styles.descText} numberOfLines={2}>{tr(description)}</Text>

          {onPressAction && (
            <TouchableOpacity
              onPress={onPressAction}
              activeOpacity={0.7}
              style={styles.actionBtn}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionText}>{tr(actionText)}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.tealDark} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={28} color={colors.tealDark} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tealLight,
    borderRadius: radius.card,
    padding: spacing.base,
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    ...shadows.soft
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md
  },
  badgePill: {
    backgroundColor: '#D1F0E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  badgeText: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '600',
    fontSize: 10,
  },
  titleText: {
    ...typography.heading3,
    color: colors.tealDark,
    fontWeight: '600'
  },
  descText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18
  },
  actionBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start'
  },
  actionText: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '600',
    fontSize: 12
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  }
});

