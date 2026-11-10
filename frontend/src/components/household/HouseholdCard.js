import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { PriorityBadge } from '../tasks/PriorityBadge';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateUtils';
import { AvatarImage } from '../common/AvatarImage';

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
        <AvatarImage
          name={household.primary_contact_name}
          role="COMMUNITY"
          size={42}
          showBorder
          borderColor={colors.border}
          style={{ marginRight: 12 }}
        />

        <View style={styles.headInfo}>
          <Text style={styles.name}>{tr(household.primary_contact_name)}</Text>
          <Text style={styles.idText}>{tr(household.household_id)} • {tr(household.village)}</Text>
        </View>

        <PriorityBadge priority={household.priority} />
      </View>

      {household.sub_area ? (
        <Text style={styles.areaText} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {tr(household.sub_area)}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.badgePill}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.badgeText}>{tr(household.members_count || members.length)}{' '}{tr('members')}</Text>
        </View>

        {pregnantCount > 0 && (
          <View style={[styles.badgePill, styles.pregnantPill]}>
            <Ionicons name="female-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.pregnantText}>{tr(pregnantCount)}{' '}{tr('Pregnant')}</Text>
          </View>
        )}

        {infantCount > 0 && (
          <View style={[styles.badgePill, styles.infantPill]}>
            <Ionicons name="happy-outline" size={12} color={colors.teal} style={{ marginRight: 4 }} />
            <Text style={styles.infantText}>{tr(infantCount)}{' '}{tr('Infant')}</Text>
          </View>
        )}

        {highRiskCount > 0 && (
          <View style={[styles.badgePill, styles.highRiskPill]}>
            <Ionicons name="alert-circle-outline" size={12} color={colors.danger} style={{ marginRight: 4 }} />
            <Text style={styles.highRiskText}>{tr('High Risk')}</Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{tr('Last visit:')}{' '}{tr(household.last_visit_date ? formatDate(household.last_visit_date) : 'None')}
        </Text>
        {household.next_follow_up && (
          <View style={styles.followupContainer}>
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={styles.followupText}>{tr('Next:')}{' '}{tr(formatDate(household.next_follow_up))}
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
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarInitial: {
    ...typography.heading3,
    color: colors.primary,
    fontWeight: '600'
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
    borderColor: 'rgba(11, 18, 32, 0.06)'
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
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  highRiskText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
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
