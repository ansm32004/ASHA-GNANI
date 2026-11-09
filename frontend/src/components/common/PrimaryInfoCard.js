import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AvatarImage } from './AvatarImage';

export const PrimaryInfoCard = ({
  beneficiaryName = 'Meena Devi',
  householdId = 'HH-RK-001',
  visitPurpose = 'Maternal Health (ANC Checkup)',
  scheduledDate = 'Today, Nov 3',
  scheduledTime = '11:30 AM',
  priority = 'Urgent',
  location = 'Ward 3, Rampur Kalan',
  onPressDetails,
  onPressReschedule
}) => {
  return (
    <View style={styles.card}>
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.doctorInfoRow}>
          <AvatarImage
            name={beneficiaryName}
            role="Pregnant Woman"
            size={42}
            showBorder
            borderColor={colors.border}
            style={{ marginRight: 12 }}
          />
          <View style={styles.nameColumn}>
            <Text style={styles.beneficiaryName}>{beneficiaryName}</Text>
            <Text style={styles.purposeText}>{visitPurpose}</Text>
          </View>
        </View>

        <View style={styles.priorityPill}>
          <Text style={styles.priorityText}>{priority}</Text>
        </View>
      </View>

      {/* Date & Time pill container */}
      <View style={styles.timeContainer}>
        <View style={styles.timeItem}>
          <Ionicons name="calendar-outline" size={15} color={colors.textWhite} style={styles.timeIcon} />
          <Text style={styles.timeText}>{scheduledDate}</Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={15} color={colors.textWhite} style={styles.timeIcon} />
          <Text style={styles.timeText}>{scheduledTime}</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onPressDetails}
          activeOpacity={0.85}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>Record Visit Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressReschedule}
          activeOpacity={0.75}
          style={styles.rescheduleButton}
        >
          <Ionicons name="time-outline" size={16} color={colors.textWhite} />
          <Text style={styles.rescheduleButtonText}>Reschedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.largeCard,
    padding: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.sm,
    ...shadows.floating
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  nameColumn: {
    flex: 1
  },
  beneficiaryName: {
    ...typography.heading2,
    color: colors.textWhite,
    fontWeight: '600'
  },
  purposeText: {
    ...typography.bodySmall,
    color: colors.primaryMuted,
    marginTop: 2
  },
  priorityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  priorityText: {
    ...typography.caption,
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 11
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: radius.medium,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  timeIcon: {
    marginRight: 6
  },
  timeText: {
    ...typography.bodyMedium,
    color: colors.textWhite,
    fontWeight: '500'
  },
  timeDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: spacing.sm
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    gap: 10
  },
  detailsButton: {
    flex: 1.4,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600'
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 12,
    borderRadius: radius.medium
  },
  rescheduleButtonText: {
    ...typography.button,
    color: colors.textWhite,
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 13
  }
});

