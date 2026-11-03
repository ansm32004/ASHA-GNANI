import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { PriorityBadge } from '../tasks/PriorityBadge';
import { useTranslation } from 'react-i18next';

export const HouseholdCard = ({ household, onPress }) => {
  const { t } = useTranslation();

  const members = household.members || [];
  const pregnantCount = members.filter(m => m.category === 'Pregnant Woman').length;
  const infantCount = members.filter(m => m.category === 'Infant').length;
  const highRiskCount = members.filter(m => m.is_high_risk).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {household.primary_contact_name ? household.primary_contact_name.charAt(0) : 'H'}
          </Text>
        </View>

        <View style={styles.headInfo}>
          <Text style={styles.name}>{household.primary_contact_name}</Text>
          <Text style={styles.idText}>{household.household_id} • {household.village}</Text>
        </View>

        <PriorityBadge priority={household.priority} />
      </View>

      {household.sub_area ? (
        <Text style={styles.areaText} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {household.sub_area}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.badgePill}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.badgeText}>{household.members_count || members.length} members</Text>
        </View>

        {pregnantCount > 0 && (
          <View style={[styles.badgePill, styles.pregnantPill]}>
            <Text style={styles.pregnantText}>🤰 {pregnantCount} Pregnant</Text>
          </View>
        )}

        {infantCount > 0 && (
          <View style={[styles.badgePill, styles.infantPill]}>
            <Text style={styles.infantText}>👶 {infantCount} Infant</Text>
          </View>
        )}

        {highRiskCount > 0 && (
          <View style={[styles.badgePill, styles.highRiskPill]}>
            <Text style={styles.highRiskText}>⚠️ High Risk</Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Last visit: {household.last_visit_date || 'None'}
        </Text>
        {household.next_follow_up && (
          <View style={styles.followupContainer}>
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={styles.followupText}>
              Next: {household.next_follow_up}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarInitial: {
    ...typography.heading3,
    color: colors.primary,
    fontWeight: '700'
  },
  headInfo: {
    flex: 1,
    marginRight: spacing.sm
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  idText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1
  },
  areaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.sm
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
    fontSize: 11
  },
  pregnantPill: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#FCE0B3'
  },
  pregnantText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    fontSize: 10
  },
  infantPill: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryMuted
  },
  infantText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10
  },
  highRiskPill: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#F7C5C5'
  },
  highRiskText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 10
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: 4
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11
  },
  followupContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  followupText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 3,
    fontSize: 11
  }
});
