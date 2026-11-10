import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AvatarImage } from './AvatarImage';

export const VisitHighlightCard = ({
  beneficiaryName = 'Meena Devi',
  householdId = 'HH-RK-001',
  visitPurpose = 'Maternal Health (ANC Checkup)',
  scheduledDate = 'Today, Nov 4',
  scheduledTime = '11:30 AM',
  priority = 'Urgent',
  onPressRecord,
  onPressReschedule
}) => {
  return (
    <View style={styles.card}>
      {/* Top Row: Avatar, Beneficiary Details & Priority Badge */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <AvatarImage
            name={beneficiaryName}
            role="Pregnant Woman"
            size={40}
            showBorder
            borderColor={colors.border}
          />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.nameText} numberOfLines={1}>{tr(beneficiaryName)}</Text>
          <Text style={styles.purposeText} numberOfLines={1}>{tr(visitPurpose)} • {tr(householdId)}</Text>
        </View>

        <View style={styles.priorityCapsule}>
          <Text style={styles.priorityText}>{tr(priority)}</Text>
        </View>
      </View>

      {/* Date, Time & Location Strip */}
      <View style={styles.capsuleRow}>
        <View style={styles.capsule}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={styles.capsuleIcon}>
            <Rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.textSecondary} strokeWidth="2" />
            <Line x1="16" y1="2" x2="16" y2="6" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            <Line x1="8" y1="2" x2="8" y2="6" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            <Line x1="3" y1="10" x2="21" y2="10" stroke={colors.textSecondary} strokeWidth="2" />
          </Svg>
          <Text style={styles.capsuleText}>{tr(scheduledDate)}, {tr(scheduledTime)}</Text>
        </View>
        <View style={styles.capsule}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={styles.capsuleIcon}>
            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={colors.textSecondary} strokeWidth="2" />
            <Circle cx="12" cy="10" r="3" stroke={colors.textSecondary} strokeWidth="2" />
          </Svg>
          <Text style={styles.capsuleText}>{tr('Ward 3, Rampur Kalan')}</Text>
        </View>
      </View>

      {/* Clinical Guidance Box */}
      <View style={styles.clinicalGuidanceBox}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, marginTop: 1 }}>
          <Circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth="2" />
          <Line x1="12" y1="16" x2="12" y2="12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <Circle cx="12" cy="8" r="1" fill={colors.primary} />
        </Svg>
        <Text style={styles.clinicalNoteText}>{tr('IFA tablet intake verification & blood pressure monitoring due today.')}</Text>
      </View>

      {/* Action Buttons with 48px Minimum Touch Target */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onPressRecord}
          activeOpacity={0.85}
          style={styles.recordButton}
          accessibilityLabel={tr('Record Visit')}
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Rect x="9" y="2" width="6" height="12" rx="3" fill="#FFFFFF" />
            <Path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="12" y1="19" x2="12" y2="22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.recordButtonText}>{tr('Record Visit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressReschedule}
          activeOpacity={0.8}
          style={styles.rescheduleButton}
          accessibilityLabel={tr('Reschedule')}
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.textSecondary} strokeWidth="2" />
            <Line x1="16" y1="2" x2="16" y2="6" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            <Line x1="8" y1="2" x2="8" y2="6" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            <Line x1="3" y1="10" x2="21" y2="10" stroke={colors.textSecondary} strokeWidth="2" />
          </Svg>
          <Text style={styles.rescheduleButtonText}>{tr('Reschedule')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.cardInternal,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: 0,
    ...shadows.card
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    ...shadows.subtle
  },
  infoCol: {
    flex: 1,
    marginRight: 8
  },
  nameText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  purposeText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  priorityCapsule: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start'
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger
  },
  capsuleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  capsuleIcon: {
    marginRight: 5
  },
  capsuleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary
  },
  clinicalGuidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 16
  },
  clinicalNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  recordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    height: spacing.minTouchTarget,
    borderRadius: radius.pill
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    height: spacing.minTouchTarget,
    borderRadius: radius.pill
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  }
});

export default VisitHighlightCard;
