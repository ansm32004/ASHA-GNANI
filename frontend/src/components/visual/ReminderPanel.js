import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, shadows, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/dateUtils';

/**
 * ReminderPanel
 * Floating white panel for verified upcoming reminders, visits, and clinical milestones.
 */
export const ReminderPanel = ({
  title = "3rd Trimester ANC Checkup",
  beneficiaryName = "Meena Devi",
  householdId = "HH-RK-001",
  date = "Today, 11:30 AM",
  description = "Verify BP, haemoglobin levels & distribute Iron Folic Acid (IFA) tablets.",
  priority = "Urgent",
  category = "Pregnancy",
  actionLabel = "Record Field Visit",
  onAction,
  onSecondaryAction,
  secondaryActionLabel = "Reschedule"
}) => {
  const isUrgent = priority === 'Urgent';
  const accentColor = category === 'Pregnancy' ? colors.coral : category === 'Child' ? colors.teal : colors.primary;

  return (
    <View style={[styles.card]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.tagGroup}>
          <View style={[styles.categoryPill, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.categoryPillText, { color: accentColor }]}>{tr(category)}</Text>
          </View>
          {isUrgent && (
            <View style={styles.urgentPill}>
              <View style={styles.urgentDot} />
              <Text style={styles.urgentText}>{tr('Priority')}</Text>
            </View>
          )}
        </View>

        {/* Date capsule */}
        <View style={styles.dateCapsule}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 4H5C3.89 4 3 4.89 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.89 20.1 4 19 4Z"
              stroke={colors.secondaryText}
              strokeWidth="2"
            />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.secondaryText} strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.dateText}>{tr(formatDate(date))}</Text>
        </View>
      </View>

      {/* Main Title & Member Info */}
      <Text style={styles.titleText}>{tr(title)}</Text>
      <View style={styles.memberRow}>
        <Text style={styles.memberName}>{tr(beneficiaryName)}</Text>
        <Text style={styles.memberId}>({tr(householdId)})</Text>
      </View>

      {/* Description */}
      <Text style={styles.descriptionText}>{tr(description)}</Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {secondaryActionLabel && onSecondaryAction ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSecondaryAction}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>{tr(secondaryActionLabel)}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{tr(actionLabel)}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 8
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600'
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  urgentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.danger,
    marginRight: 4
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger
  },
  dateCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    lineHeight: 22
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
    gap: 6
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.deepBlue
  },
  memberId: {
    fontSize: 12,
    color: colors.secondaryText
  },
  descriptionText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
    marginBottom: 12
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textWhite
  }
});

export default ReminderPanel;

